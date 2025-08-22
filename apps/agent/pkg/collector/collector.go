package collector

import (
	"runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/cpu"
	"github.com/shirou/gopsutil/v4/disk"
	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/mem"
	"github.com/shirou/gopsutil/v4/net"
)

func Collect() (Metrics, error) {
	timestamp := time.Now().UTC().Format(time.RFC3339)

	// OS Info
	hinfo, err := host.Info()
	if err != nil {
		return Metrics{}, err
	}
	osInfo := OSInfo{
		Hostname:      hinfo.Hostname,
		Platform:      hinfo.Platform,
		PlatformVer:   hinfo.PlatformVersion,
		Arch:          runtime.GOARCH,
		UptimeSeconds: hinfo.Uptime,
	}

	// CPU
	cpuPercents, err := cpu.Percent(time.Second, false)
	if err != nil {
		return Metrics{}, err
	}
	cpuPercent := 0.0
	if len(cpuPercents) > 0 {
		cpuPercent = cpuPercents[0]
	}

	cpuInfos, err := cpu.Info()
	if err != nil {
		return Metrics{}, err
	}

	var cpuModel string
	var cpuCores int
	var cpuMHz float64
	if len(cpuInfos) > 0 {
		cpuModel = cpuInfos[0].ModelName
		cpuCores = int(cpuInfos[0].Cores)
		cpuMHz = cpuInfos[0].Mhz
	}
	cpuInfo := CPUInfo{
		Percent: cpuPercent,
		Cores:   cpuCores,
		Model:   cpuModel,
		MHz:     cpuMHz,
	}

	// Memory
	vmem, err := mem.VirtualMemory()
	if err != nil {
		return Metrics{}, err
	}
	memInfo := MemInfo{
		TotalBytes:  vmem.Total,
		UsedBytes:   vmem.Used,
		UsedPercent: vmem.UsedPercent,
	}

	// Disk (main mount only)
	partitions, err := disk.Partitions(false)
	if err != nil {
		return Metrics{}, err
	}
	disks := []DiskInfo{}
	for _, p := range partitions {
		if strings.HasPrefix(p.Mountpoint, "/System") || strings.HasPrefix(p.Mountpoint, "/dev") {
			continue
		}
		usage, err := disk.Usage(p.Mountpoint)
		if err == nil {
			disks = append(disks, DiskInfo{
				Mountpoint:  usage.Path,
				TotalBytes:  usage.Total,
				UsedBytes:   usage.Used,
				UsedPercent: usage.UsedPercent,
			})
			break // only main mount
		}
	}

	// Network
	ioStats, err := net.IOCounters(true)
	if err != nil {
		return Metrics{}, err
	}
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
	netInfo := NetInfo{
		TotalBytesSent: totalSent,
		TotalBytesRecv: totalRecv,
	}

	metrics := Metrics{
		Timestamp: timestamp,
		OS:        osInfo,
		CPU:       cpuInfo,
		Memory:    memInfo,
		Disk:      disks,
		Network:   netInfo,
	}

	return metrics, nil
}
