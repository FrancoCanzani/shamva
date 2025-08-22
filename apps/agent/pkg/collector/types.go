package collector

type Metrics struct {
	Timestamp      string  `json:"timestamp"`
	Hostname       string  `json:"hostname"`
	Platform       string  `json:"platform"`
	CPUPercent     float64 `json:"cpu_percent"`
	LoadAvg1       float64 `json:"load_avg_1"`
	MemoryPercent  float64 `json:"memory_percent"`
	DiskPercent    float64 `json:"disk_percent"`
	NetworkSentMB  float64 `json:"network_sent_mb"`
	NetworkRecvMB  float64 `json:"network_recv_mb"`
	TopProcessName string  `json:"top_process_name"`
	TopProcessCPU  float64 `json:"top_process_cpu"`
	TotalProcesses int     `json:"total_processes"`
}
