package collector

import (
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/load"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"
	"github.com/shirou/gopsutil/v4/process"
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
	partitions, err := disk.Partitions(false)
	if err == nil {
		for _, p := range partitions {
			if strings.HasPrefix(p.Mountpoint, "/System") || strings.HasPrefix(p.Mountpoint, "/dev") {
				continue
			}
			usage, err := disk.Usage(p.Mountpoint)
			if err == nil {
				diskPercent = usage.UsedPercent
				break
			}
		}
	}

	// Network usage
	networkSentMB := 0.0
	networkRecvMB := 0.0
	ioStats, err := net.IOCounters(true)
	if err == nil {
		var totalSent, totalRecv uint64
		for _, io := range ioStats {
			if strings.HasPrefix(io.Name, "lo") || strings.HasPrefix(io.Name, "utun") || strings.HasPrefix(io.Name, "awdl") || strings.HasPrefix(io.Name, "bridge") {
				continue
			}
			if io.BytesSent == 0 && io.BytesRecv == 0 {
				continue
			}
			totalSent += io.BytesSent
			totalRecv += io.BytesRecv
		}
		networkSentMB = float64(totalSent) / 1024 / 1024
		networkRecvMB = float64(totalRecv) / 1024 / 1024
	}

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

	metrics := Metrics{
		Timestamp:      timestamp,
		Hostname:       hinfo.Hostname,
		Platform:       hinfo.Platform,
		CPUPercent:     cpuPercent,
		LoadAvg1:       loadAvg1,
		MemoryPercent:  vmem.UsedPercent,
		DiskPercent:    diskPercent,
		NetworkSentMB:  networkSentMB,
		NetworkRecvMB:  networkRecvMB,
		TopProcessName: topProcessName,
		TopProcessCPU:  topProcessCPU,
		TotalProcesses: totalProcesses,
	}

	return metrics, nil
}
