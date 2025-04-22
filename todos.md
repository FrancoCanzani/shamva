# Website Monitoring System – Core Metrics

A simple guide to monitor your website's availability and health.

## 1. Uptime (Availability Percentage)

Goal: Know how often your site is available.

Steps:
1. Send an HTTP GET request every minute.
2. If response status is 200–299, count as success.
3. Track total and successful checks.
4. Calculate uptime:
   uptime % = (successful checks / total checks) * 100

## 2. Downtime Incidents

Goal: Track when and how long your site goes down.

Steps:
1. On failed check, save the start time.
2. On next successful check, save the end time.
3. Record each incident with start, end, and duration.
4. Count total incidents over time.

## 3. Ping / Heartbeat Checks

Goal: Check if the site is reachable.

Steps:
1. Send an HTTP HEAD request:
   const res = await fetch('https://example.com', { method: 'HEAD' });
2. Consider using TCP or ICMP ping for lower-level checks.

## 4. SSL Certificate Validity

Goal: Check if the HTTPS certificate is valid and not expired.

Steps:
1. Open a TLS connection and read the cert expiry:
   ```
   const tls = require('tls');
   const socket = tls.connect(443, 'example.com', { servername: 'example.com' }, () => {
     const cert = socket.getPeerCertificate();
     console.log(cert.valid_to);
     socket.end();
   });
   ```
2. Alert if cert is expiring soon (e.g. within 30 days).

## 5. DNS Resolution

Goal: Ensure your domain resolves to an IP address.

Steps:
1. Use DNS lookup:
   ```
   const dns = require('dns');
   dns.lookup('example.com', (err, address) => {
     if (err) console.error('DNS error:', err.message);
     else console.log('IP:', address);
   });
   ```
2. Record any failures or resolution delays.

## 6. Status Code Tracking

Goal: Monitor what kind of responses your site gives.

Steps:
1. After each request, log the response status:
   ```
   const res = await fetch('https://example.com');
   console.log(res.status);
   ```
2. Count and group by:
   - 2xx: success
   - 3xx: redirects
   - 4xx: client errors
   - 5xx: server errors

## Suggested Tools

- Scheduler: cron job or setInterval
- Backend: Node.js, Go, Python
- Storage: PostgreSQL, SQLite, Supabase
- (Optional) Alerts: email, SMS, Slack

--------------------------

# Website Monitoring System – Performance Metrics

A simple guide to measure how fast your site loads and responds.

## 1. Time to First Byte (TTFB)

Goal: Measure how fast the server starts responding.

Steps:
1. Send an HTTP GET request.
2. Record the time from request start to first byte received.
3. Tools: `performance.timing.responseStart - performance.timing.requestStart` in browser,
   or use built-in tools like `curl -w '%{time_starttransfer}\n'`.

## 2. First Contentful Paint (FCP)

Goal: Time until the first visible content is shown.

Steps:
1. Use browser's `PerformanceObserver` API:
   ```
   new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       if (entry.name === 'first-contentful-paint') {
         console.log('FCP:', entry.startTime);
       }
     }
   }).observe({ type: 'paint', buffered: true });
   ```

## 3. Largest Contentful Paint (LCP)

Goal: Time when the largest visible element is rendered.

Steps:
1. Use `PerformanceObserver` with `largest-contentful-paint`:
   ```
   new PerformanceObserver((list) => {
     for (const entry of list.getEntries()) {
       console.log('LCP:', entry.startTime);
     }
   }).observe({ type: 'largest-contentful-paint', buffered: true });
   ```

## 4. Total Load Time

Goal: Time taken for the page to fully load.

Steps:
1. Use:
   ```
   window.addEventListener('load', () => {
     const loadTime = performance.now();
     console.log('Total Load Time:', loadTime);
   });
   ```

## 5. Time to Interactive (TTI)

Goal: Time when the page becomes fully interactive.

Steps:
1. Use Lighthouse (Chrome DevTools) to measure TTI.
2. Or use `ttfb` + JavaScript event timings with heuristics (complex to get manually).

## 6. Server Response Time

Goal: Time server takes to process a request.

Steps:
1. On server, log time from request received to response sent.
2. Or on client, subtract `performance.responseEnd - performance.requestStart`.

## 7. Page Size & Number of Requests

Goal: Track total size of assets and number of network requests.

Steps:
1. Use `window.performance.getEntriesByType('resource')`:
   ```
   const resources = performance.getEntriesByType('resource');
   const totalBytes = resources.reduce((sum, res) => sum + res.transferSize, 0);
   console.log('Total size:', totalBytes, 'bytes');
   console.log('Request count:', resources.length);
   ```

## 8. Third-party Scripts Impact

Goal: Measure how much external scripts affect performance.

Steps:
1. Identify third-party URLs (e.g. Google Analytics, chat widgets).
2. Use `performance.getEntries()` and filter by `initiatorType === 'script'`.
3. Measure their load time and blocking impact.

## Suggested Tools

- Browser APIs: `PerformanceObserver`, `performance.timing`, `getEntriesByType`
- Chrome DevTools / Lighthouse
- Puppeteer / Playwright (for automation)
- Analytics tools like Web Vitals or SpeedCurve
