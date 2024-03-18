# Changelog

All notable changes to this project will be documented in this file.


The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
## [Unreleased]

* add support for passing custom detectors

## [0.4.6] - 2024-03-11

- fix package.json

## [0.4.5] - 2024-03-11

* remove esm build

## [0.4.4] - 2024-03-11

* fix build for next.js projects

## [0.4.3] - 2024-03-04

* Handle lambda timeouts gracefully
  
## [0.4.2] - 2024-03-04

* fix: install script

## [0.4.1] - 2024-03-04

* Bundle seperately and package opentelemetry
* Fix import-in-the-middle import with a patch

## [0.4.0] - 2024-03-02

* Support for capturing http client request and response bodies


## [0.3.9] - 2024-02-29

* adds some utils for aws lambda

## [0.3.8] - 2024-02-15 

* fix trpc packaging

## [0.3.7] - 2024-02-14

* remove duplicate setup
  
## [0.3.6] - 2024-02-12

* adjust log options to reduce noise

## [0.3.5] - 2024-02-12

* update package lock to update trpc/server
  
## [0.3.4] - 2024-02-12

* fix ts error in build
  
## [0.3.3] - 2024-02-12

* support trpc v11
  
## [0.3.2] - 2024-02-12 

* allow optional sampling

## [0.3.1] - 2024-02-12 

* Log to console if no api key present

## [0.3.0] - 2023-12-14

- fix overriding service with env
- Koyeb Service Discovery


## [0.2.14] - 2023-11-20

- upgrade packages
  
## [0.2.13] - 2023-11-17

- pass through service name
  
## [0.2.12] - 2023-11-14

- debug and timeout in 1 second
  
## [0.2.11] - 2023-11-07

- publish to github packages
  
## [0.2.10] - 2023-11-04

- api key fallback
  
## [0.2.9] - 2023-11-04 

- Add Request Body Parsing
- Add API KEY Tracer disabling
  
## [0.2.8] - 2023-10-19

- Improve service and namespace detection for vercel
- Document TRPC middleware
  
## [0.2.7] - 2023-10-19

- Better Plugin api
  
## [0.2.6] - 2023-10-18

- http plugin format
  
## [0.2.5] - 2023-10-18

- fix npm package exports for cjs
  
## [0.2.4] - 2023-10-18

- bundle correctly
  
## [0.2.3] - 2023-10-17

- fix
  
## [0.2.2] - 2023-10-17

- Vercel Env Detection
  
## [0.2.2-0] - 2023-10-17
- trpc
  
## [0.2.1] - 2023-10-15

- cjs exports
  
## [0.2.0] - 2023-10-15

- optimised build 2.8mb -> 175kb
- fixed resource attributes
- serverless mode - use simplespanprocessor to not drop spans in lambda
- now this library is tested
- added support for telemetry extensions

## [0.1.0] 2023-08-10

- initial version
