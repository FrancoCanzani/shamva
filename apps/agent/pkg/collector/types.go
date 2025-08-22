package collector

type Metrics struct {
	Timestamp string     `json:"timestamp"`
	OS        OSInfo     `json:"os"`
	CPU       CPUInfo    `json:"cpu"`
	Memory    MemInfo    `json:"memory"`
	Disk      []DiskInfo `json:"disk"`
	Network   NetInfo    `json:"network"`
}

type OSInfo struct {
	Hostname      string `json:"hostname"`
	Platform      string `json:"platform"`
	PlatformVer   string `json:"platform_version"`
	Arch          string `json:"arch"`
	UptimeSeconds uint64 `json:"uptime_seconds"`
}

type CPUInfo struct {
	Percent float64 `json:"percent"`
	Cores   int     `json:"cores"`
	Model   string  `json:"model"`
	MHz     float64 `json:"mhz"`
}

type MemInfo struct {
	TotalBytes  uint64  `json:"total_bytes"`
	UsedBytes   uint64  `json:"used_bytes"`
	UsedPercent float64 `json:"used_percent"`
}

type DiskInfo struct {
	Mountpoint  string  `json:"mountpoint"`
	TotalBytes  uint64  `json:"total_bytes"`
	UsedBytes   uint64  `json:"used_bytes"`
	UsedPercent float64 `json:"used_percent"`
}

type NetInfo struct {
	TotalBytesSent uint64 `json:"total_bytes_sent"`
	TotalBytesRecv uint64 `json:"total_bytes_recv"`
}
