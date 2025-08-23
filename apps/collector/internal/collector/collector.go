package collector

import (
	"strings"
	"time"

	"github.com/distatus/battery"
	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/load"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"
	"github.com/shirou/gopsutil/v4/process"
	"github.com/shirou/gopsutil/v4/sensors"
)

func Collect() (Metrics, error) {
	timestamp := time.Now().UTC().Format(time.RFC3339)

	// Basic system info
	hinfo, err := host.Info()
	if err != nil {
		return Metrics{}, err
	}

	// CPU usage
	cpuPercents, err := cpu.Percent(time.Second, false)
	if err != nil {
		return Metrics{}, err
	}
	cpuPercent := 0.0
	if len(cpuPercents) > 0 {
		cpuPercent = cpuPercents[0]
	}

	// Load average
	loadAvg, err := load.Avg()
	loadAvg1 := 0.0
	if err == nil {
		loadAvg1 = loadAvg.Load1
	}

	// Memory usage
	vmem, err := mem.VirtualMemory()
	if err != nil {
		return Metrics{}, err
	}

	// Disk usage (main partition only)
	diskPercent := 0.0
	diskFreeGB := 0.0
	diskTotalGB := 0.0
	partitions, err := disk.Partitions(false)
	if err == nil {
		for _, p := range partitions {
			if strings.HasPrefix(p.Mountpoint, "/System") || strings.HasPrefix(p.Mountpoint, "/dev") {
				continue
			}
			usage, err := disk.Usage(p.Mountpoint)
			if err == nil {
				diskPercent = usage.UsedPercent
				diskFreeGB = float64(usage.Free) / 1024 / 1024 / 1024
				diskTotalGB = float64(usage.Total) / 1024 / 1024 / 1024
				break
			}
		}
	}

	// Network usage and bandwidth
	networkSentMB := 0.0
	networkRecvMB := 0.0
	networkSentMBps := 0.0
	networkRecvMBps := 0.0
	networkConnected := false
	networkInterface := ""

	ioStats, err := net.IOCounters(true)
	if err == nil {
		var totalSent, totalRecv uint64
		var activeSent, activeRecv uint64
		for _, io := range ioStats {
			if strings.HasPrefix(io.Name, "lo") || strings.HasPrefix(io.Name, "utun") || strings.HasPrefix(io.Name, "awdl") || strings.HasPrefix(io.Name, "bridge") {
				continue
			}
			if io.BytesSent == 0 && io.BytesRecv == 0 {
				continue
			}
			totalSent += io.BytesSent
			totalRecv += io.BytesRecv

			// Track active interface for bandwidth calculation
			if activeSent == 0 || io.BytesSent > activeSent {
				activeSent = io.BytesSent
				activeRecv = io.BytesRecv
				networkInterface = io.Name
				networkConnected = true
			}
		}
		networkSentMB = float64(totalSent) / 1024 / 1024
		networkRecvMB = float64(totalRecv) / 1024 / 1024

		// Simple bandwidth estimation based on bytes per second (approximate)
		if activeSent > 0 {
			networkSentMBps = float64(activeSent) / 1024 / 1024 / 60 // rough estimate per minute
			networkRecvMBps = float64(activeRecv) / 1024 / 1024 / 60
		}
	}

	// Network connectivity is already determined above by checking active interfaces
	// If we found any non-loopback interfaces with traffic, we're connected

	// Top process by CPU
	topProcessName := ""
	topProcessCPU := 0.0
	totalProcesses := 0
	processes, err := process.Processes()
	if err == nil {
		totalProcesses = len(processes)
		maxCPUPercent := 0.0
		for _, p := range processes {
			name, err := p.Name()
			if err != nil {
				continue
			}
			cpuPercent, err := p.CPUPercent()
			if err != nil {
				continue
			}
			if cpuPercent > maxCPUPercent {
				maxCPUPercent = cpuPercent
				topProcessName = name
				topProcessCPU = cpuPercent
			}
		}
	}

	// Temperature from system sensors
	temperatureCelsius := 0.0
	temperatures, err := sensors.SensorsTemperatures()
	if err == nil && len(temperatures) > 0 {
		// Get the first CPU/system temperature reading
		for _, temp := range temperatures {
			if strings.Contains(strings.ToLower(temp.SensorKey), "cpu") ||
				strings.Contains(strings.ToLower(temp.SensorKey), "core") ||
				strings.Contains(strings.ToLower(temp.SensorKey), "temp") {
				temperatureCelsius = temp.Temperature
				break
			}
		}
		// If no CPU temp found, use the first available temperature
		if temperatureCelsius == 0.0 && len(temperatures) > 0 {
			temperatureCelsius = temperatures[0].Temperature
		}
	}

	// Battery and power status
	powerStatus := "AC"
	batteryPercent := 0.0
	batteries, err := battery.GetAll()
	if err == nil && len(batteries) > 0 {
		// Use the first battery
		bat := batteries[0]
		batteryPercent = bat.Current / bat.Full * 100

		switch bat.State.Raw {
		case battery.Charging:
			powerStatus = "Charging"
		case battery.Discharging:
			powerStatus = "Battery"
		case battery.Full:
			powerStatus = "Full"
		case battery.Idle:
			powerStatus = "Idle"
		default:
			powerStatus = "AC"
		}
	}

	// System uptime
	uptimeSeconds := uint64(0)
	if bootTime, err := host.BootTime(); err == nil {
		uptimeSeconds = uint64(time.Now().Unix()) - bootTime
	}

	metrics := Metrics{
		Timestamp:          timestamp,
		Hostname:           hinfo.Hostname,
		Platform:           hinfo.Platform,
		CPUPercent:         cpuPercent,
		LoadAvg1:           loadAvg1,
		MemoryPercent:      vmem.UsedPercent,
		MemoryUsedGB:       float64(vmem.Used) / 1024 / 1024 / 1024,
		MemoryTotalGB:      float64(vmem.Total) / 1024 / 1024 / 1024,
		DiskPercent:        diskPercent,
		DiskFreeGB:         diskFreeGB,
		DiskTotalGB:        diskTotalGB,
		NetworkSentMB:      networkSentMB,
		NetworkRecvMB:      networkRecvMB,
		NetworkSentMBps:    networkSentMBps,
		NetworkRecvMBps:    networkRecvMBps,
		TopProcessName:     topProcessName,
		TopProcessCPU:      topProcessCPU,
		TotalProcesses:     totalProcesses,
		TemperatureCelsius: temperatureCelsius,
		PowerStatus:        powerStatus,
		BatteryPercent:     batteryPercent,
		NetworkConnected:   networkConnected,
		NetworkInterface:   networkInterface,
		UptimeSeconds:      uptimeSeconds,
	}

	return metrics, nil
}
