## JS backend Benchmark

This is a simple benchmark to compare __ritley__ among the most popular JS backend frameworks.

> although we're missing __Nest__ but since is express based we expect anything above it. However it can run over fastify too :v:

| Framework     | Requests/5s   | Avg ms| Max ms|
| ------------- |:-------------:| :----:| :----:|
| Polka         | 309k          | 1.54  | 109.56|
| Fastify       | 250k          | 1.92  | 162.54|
| Ritley        | 245k          | 1.96  |  79.26|
| Express       | 117k          | 4.15  | 218.03|

## Details

#### 1. Polka :trophy:
```
k1r0s@k1r0s-N2x0WU:~$ autocannon -c 100 -d 5 -p 10 localhost:3001
Running 5s test @ http://localhost:3001 (polka)
100 connections with 10 pipelining factor

Stat         Avg     Stdev   Max     
Latency (ms) 1.54    4.15    109.56  
Req/Sec      61868.8 6572.69 66696   
Bytes/Sec    6.89 MB 767 kB  7.47 MB

309k requests in 5s, 34.6 MB read (polka)
```

#### 2. Fastify
```
k1r0s@k1r0s-N2x0WU:~$ autocannon -c 100 -d 5 -p 10 localhost:3002
Running 5s test @ http://localhost:3002 (fastify)
100 connections with 10 pipelining factor

Stat         Avg     Stdev   Max     
Latency (ms) 1.92    5.34    162.54  
Req/Sec      49942.4 7439.48 55041   
Bytes/Sec    8.23 MB 1.22 MB 9.03 MB

250k requests in 5s, 41 MB read (fastify)
```

#### 3. Ritley
```
k1r0s@k1r0s-N2x0WU:~$ autocannon -c 100 -d 5 -p 10 localhost:3003
Running 5s test @ http://localhost:3003 (ritley)
100 connections with 10 pipelining factor

Stat         Avg     Stdev   Max    
Latency (ms) 1.96    5.24    79.26  
Req/Sec      48982.4 3776.57 51791  
Bytes/Sec    5.53 MB 486 kB  5.8 MB

245k requests in 5s, 27.4 MB read (ritley)
```

#### 4. Express :turtle:
```
k1r0s@k1r0s-N2x0WU:~$ autocannon -c 100 -d 5 -p 10 localhost:3004
Running 5s test @ http://localhost:3004 (express)
100 connections with 10 pipelining factor

Stat         Avg     Stdev   Max     
Latency (ms) 4.15    11.56   218.03  
Req/Sec      23472.8 3568.24 25550   
Bytes/Sec    5.05 MB 793 kB  5.52 MB

117k requests in 5s, 25.4 MB read (express)
```
