# Flight Route Planner - MVP Architecture & Product Specification

## Overview

A web application for visualizing and planning multi-leg flight routes on an interactive world map.

Unlike traditional flight search engines, users can manually explore and build routes by selecting layover airports and viewing available flight legs and schedules.

The primary goal is route discovery and route planning rather than ticket sales.

---

# Product Vision

Allow users to:

* Select origin and destination airports.
* Visualize possible routes on an interactive map.
* Manually choose layovers.
* Explore flight legs and schedules.
* Compare route options.
* Understand total travel time and layover impact.
* Share route plans.

Future monetization can be introduced through booking affiliates and route comparison services.

---

# Core User Journey

1. User selects departure airport.
2. User selects destination airport.
3. System finds possible routes.
4. Routes are displayed on the map.
5. User can modify route by selecting preferred layovers.
6. Side panel updates in real time.
7. User can save or share route.

Example:

YYZ → KEF → LHR → FCO

---

# MVP Scope

## Included

### Airport Search

* Search airports by code or name.
* Fast autocomplete.

### Route Discovery

Input:

* Origin
* Destination

Output:

* Available routes
* Up to 3 layovers

### Interactive Map

Map-based route visualization.

Display:

* Airports
* Flight connections
* Selected route

User actions:

* Select airports
* Add layovers
* Remove layovers
* Inspect route details

### Route Summary Panel

Semi-transparent side panel.

Displays:

* Route legs
* Departure times
* Arrival times
* Flight duration
* Layover duration
* Total travel time
* Number of layovers

Example:

YYZ → KEF → LHR → FCO

Flight Time: 11h 30m
Layovers: 2
Layover Time: 4h 15m
Total Trip: 15h 45m

### Shareable Routes

SEO-friendly URLs.

Example:

/route/YYZ-KEF-LHR-FCO

### Analytics

Track:

* Searches
* Route selections
* Shared routes
* User retention

Initial solution:

* Google Analytics

Future:

* PostHog

---

# Excluded From MVP

Not included initially:

* Ticket purchasing
* Payments
* User accounts
* Saved itineraries
* Notifications
* Price tracking
* Mobile applications
* Loyalty programs

---

# Technology Decisions

## Frontend

### Framework

Angular

Reasons:

* Existing team preference.
* Strong architecture.
* Excellent dependency injection.
* RxJS works well for event-driven route planning.
* Better long-term maintainability for complex applications.

### Mapping Library

Mapbox

Reasons:

* Better custom visualization capabilities.
* Superior route rendering.
* Better support for graph-style interfaces.
* Easier route animations.
* More flexible styling.
* Better suited for aviation-focused UI.

This product is a route visualization tool rather than a navigation or local business discovery platform.

---

# Backend

## Platform

.NET

Recommended stack:

* ASP.NET Core
* C#
* GraphQL

### GraphQL Server

Hot Chocolate

Benefits:

* Strong .NET integration
* High performance
* Modern GraphQL tooling
* Future subscription support

---

# Database Architecture

## Primary Database

Neo4j

Reason:

The application is fundamentally a graph problem.

### Graph Model

Airport nodes:

(Airport)

Relationships:

(Airport)-[:ROUTE]->(Airport)

or

(Airport)-[:FLIGHT]->(Airport)

---

# Critical Data Separation

The system should separate:

## Route Network Layer

Represents possible connections.

Example:

YYZ → KEF
KEF → LHR
LHR → FCO

Purpose:

* Pathfinding
* Route discovery
* Network analysis

Changes infrequently.

---

## Schedule Layer

Represents actual flight instances.

Example:

AC123
YYZ → KEF
2026-06-21 10:00

Purpose:

* Itinerary generation
* Schedule calculations
* Layover validation

Changes frequently.

---

This separation is a key architectural decision.

---

# Backend Architecture

GraphQL should not directly contain route business logic.

Recommended architecture:

GraphQL API
↓
Route Engine
↓
Neo4j

---

# Route Engine Responsibilities

The Route Engine becomes the core business layer.

Responsibilities:

* Route discovery
* Pathfinding
* Route ranking
* Layover validation
* Schedule matching
* Route comparison
* Future pricing integrations

This layer contains the application's primary intellectual property.

---

# GraphQL API Design

Example query:

```graphql
query SearchRoutes {
  routes(
    from: "YYZ"
    to: "FCO"
    maxLayovers: 3
  ) {
    totalDuration

    legs {
      from
      to
      departure
      arrival
      airline
    }
  }
}
```

---

# UI Layout

## Main Screen

Full-screen map.

Components:

### Map

Displays:

* Airports
* Flight connections
* Selected routes

### Side Panel

Semi-transparent overlay.

Displays:

* Selected route
* Flight legs
* Layovers
* Total duration
* Comparison information

---

# Route Comparison (Future)

Allow users to compare multiple routes.

Example:

Route A:
YYZ → KEF → FCO

Route B:
YYZ → FRA → FCO

Comparison:

* Travel time
* Layovers
* Airlines
* Future pricing

---

# Flight Data Strategy

## MVP

Static/imported route dataset.

Possible sources:

* OpenFlights
* Public aviation datasets
* Airline timetable feeds

---

## Future

Commercial flight data providers.

Potential integrations:

* Amadeus
* AviationStack
* FlightAware

---

# Time Handling

Dedicated schedule/time service.

Must support:

* Time zones
* Daylight savings
* Date changes
* Overnight flights

Time calculations should not be embedded directly into GraphQL resolvers.

---

# Analytics

Initial:

* Google Analytics

Track:

* Searches
* Route selections
* Shared routes
* User sessions

Future:

* PostHog
* Funnel tracking
* Feature adoption

---

# Infrastructure

## MVP Deployment

Frontend

* Angular
* Static hosting

Backend

* ASP.NET Core
* GraphQL (Hot Chocolate)

Database

* Neo4j

---

# Initial Architecture Diagram

Angular
|
v
GraphQL API (.NET)
|
v
Route Engine
|
v
Neo4j

---

# Future Expansion

Potential additions:

* Route comparison
* Saved itineraries
* User accounts
* Booking affiliate links
* Price comparison
* Alerts
* Notifications
* Route recommendations
* Historical route analytics

---

# Final MVP Technology Stack

Frontend

* Angular
* TypeScript
* RxJS
* Mapbox

Backend

* ASP.NET Core
* C#
* GraphQL
* Hot Chocolate

Data

* Neo4j

Analytics

* Google Analytics

Core Services

* Route Engine
* Schedule Service

Primary Goal

Build the simplest possible route-planning experience with a graph-native architecture that can scale into route comparison and booking integrations without requiring a major redesign.
