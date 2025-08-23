package collector

type Metrics struct {
	Timestamp          string  `json:"timestamp"`
	Hostname           string  `json:"hostname"`
	Platform           string  `json:"platform"`
	CPUPercent         float64 `json:"cpu_percent"`
	LoadAvg1           float64 `json:"load_avg_1"`
	MemoryPercent      float64 `json:"memory_percent"`
	MemoryUsedGB       float64 `json:"memory_used_gb"`
	MemoryTotalGB      float64 `json:"memory_total_gb"`
	DiskPercent        float64 `json:"disk_percent"`
	DiskFreeGB         float64 `json:"disk_free_gb"`
	DiskTotalGB        float64 `json:"disk_total_gb"`
	NetworkSentMB      float64 `json:"network_sent_mb"`
	NetworkRecvMB      float64 `json:"network_recv_mb"`
	NetworkSentMBps    float64 `json:"network_sent_mbps"`
	NetworkRecvMBps    float64 `json:"network_recv_mbps"`
	TopProcessName     string  `json:"top_process_name"`
	TopProcessCPU      float64 `json:"top_process_cpu"`
	TotalProcesses     int     `json:"total_processes"`
	TemperatureCelsius float64 `json:"temperature_celsius"`
	PowerStatus        string  `json:"power_status"`
	BatteryPercent     float64 `json:"battery_percent"`
	NetworkConnected   bool    `json:"network_connected"`
	NetworkInterface   string  `json:"network_interface"`
	UptimeSeconds      uint64  `json:"uptime_seconds"`
}
