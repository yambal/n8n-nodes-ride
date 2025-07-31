# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2025-01-31

### Added
- **🔍 Investigation Points Export**: Added investigation points output format for trip analysis
  - New investigation points output format alongside existing Data, GeoJSON, KML, GPX, and Image formats
  - Specialized format for detailed trip analysis and investigation workflows
  - Exports key waypoints and analysis data points for further processing

### Improved
- **📚 Documentation Structure**: Reorganized project documentation
  - Separated changelog from README into dedicated CHANGELOG.md file
  - Improved README structure and readability
  - Better organization of version history and release notes

## [0.2.4] - 2024-01-XX

### Added
- **🗺️ GeoJSON Support**: Added GeoJSON output format for geographic data analysis and mapping
  - RFC 7946 compliant GeoJSON format with LineString (track) and Point (stationary) features
  - Includes comprehensive trip metadata in feature properties  
  - Enhanced compatibility with GIS applications and mapping libraries

### Changed
- **🔄 Unified Output Format**: Trip output now merges multiple formats into single item (**Breaking Change**)
  - Previous versions output separate items for each format (JOIN behavior)
  - New version combines all selected formats into one output item (MERGE behavior)
  - Improves workflow design simplicity and reduces connection complexity
- **📝 Data Naming Improvement**: "Data" format renamed to "Raw Data" for clarity
  - Output field changed from `json.data` to `json.rawData`
  - More descriptive naming for better user understanding

## [0.2.3] - 2024-01-XX

### Added
- **📄 GPX Export Support**: Added GPX (GPS Exchange Format) output for trips
  - New GPX output format option alongside existing Data, KML, and Image formats
  - Standard XML-based format compatible with most GPS devices and mapping applications
  - Includes track points, waypoints, and comprehensive trip metadata

### Improved
- **⚙️ Enhanced Normalization**: Extended track point optimization capabilities
  - Improved stationary point detection with configurable thresholds
  - Better handling of GPS noise and data inconsistencies
  - More efficient data processing for large trip datasets

### Fixed
- **🔧 Code Refactoring**: Improved code structure and maintainability
  - Consolidated stationary point detection logic
  - Enhanced data processing efficiency
  - Better code organization for future development

## [0.2.2] - 2024-01-XX

### Added
- **🔧 Data Quality Enhancement**: Added GPS track point sanitization
  - Speed outlier removal using statistical analysis (mean + 3σ)
  - Position-based speed calculation with Haversine distance formula
- **📊 Data Optimization**: Track point normalization for reduced data size
  - Stationary point detection and consolidation (10+ minutes within 100m)
  - Typical 30-70% data reduction while preserving route accuracy
- **🗺️ Enhanced Static Maps**: Improved trip visualization
  - Orange markers for stationary points (15+ minute stops)
  - Configurable image dimensions (default: 600x600px)
  - Visual hierarchy: Green start, red end, orange stationary points
- **⚙️ User Control**: Optional processing settings
  - "Sanitize Track Points" checkbox for data cleaning
  - "Normalize Track Points" checkbox for size optimization
  - Pipeline: Sanitization → Normalization → Output
- **🛠️ Reusable Utilities**: Geographic calculation framework
  - Distance calculations, stationary detection, marker extraction
  - Shared between normalization and static map features

## [0.2.1] - 2024-01-XX

### Changed
- **📊 Readable Track Points**: Route and Trip track points are now automatically converted to readable property names
  - **Route Track Points**: API format `{x, y, e}` → Readable format `{longitude, latitude, elevation}`
  - **Trip Track Points**: API format `{x, y, e, t, s, h, c}` → Readable format `{longitude, latitude, elevation, timestamp, speed, heartRate, cadence}`
  - **Immediate Conversion**: Transformation occurs immediately upon API response reception

### Improved
- **🚀 Performance Optimization**: Routes list responses skip unnecessary track point transformation
  - Routes list API responses don't include track points, so transformation is optimized to avoid wasteful processing
  - Individual route details still receive full track point transformation when present
- **🔧 Enhanced Data Processing**: Added comprehensive transformation functions in `utils/dataTransformer.ts`
  - `transformAPIRouteTrackPoint()` and related functions for Route track points
  - Maintained existing Trip transformation functions for consistency
- **📈 Improved Developer Experience**: Track point data is now more intuitive to work with in workflows
  - No need to remember that 'x' means longitude or 'y' means latitude
  - Self-documenting property names improve workflow readability

## [0.2.0] - 2024-01-XX

### Added
- **🎯 Multiple Output Formats**: Trip retrieval now supports multiple simultaneous output formats
  - **Data**: Original JSON trip data
  - **KML**: GPS/mapping application compatible format
  - **GPX**: GPS Exchange Format for universal GPS device compatibility
  - **Image**: Static map visualization using Google Maps Static API
- **🖼️ Static Map Generation**: New image output format creates visual trip representations
  - Shows complete trip route with start (S) and end (E) markers
  - Optimized for up to 200 coordinate points for detailed route display
  - Returns n8n-compatible binary data for easy integration with other nodes
- **🔐 Google Maps Integration**: Optional Google Maps API key support
  - Add API key to existing Ride API credentials (completely optional)
  - Only required for Image output format
  - All existing features continue to work without Google Maps API key
- **💡 Enhanced Flexibility**: Choose any combination of output formats in a single request
  - Generate multiple outputs (e.g., Data + KML + GPX + Image) from one trip fetch
  - Each output includes `output_format` identifier for easy processing
- **⚠️ Smart Validation**: Automatic validation prevents Image selection without API key

## [0.1.4] - 2024-01-XX

### Changed
- **Authentication Update**: Changed from API key to service account email/password authentication

## [0.1.3] - 2024-01-XX

### Changed
- Experimental features (reverted in 0.1.4)

## [0.1.2] - 2024-01-XX

### Added
- Added KML conversion functionality for trip data
- Improved error handling and validation

## [0.1.1] - 2024-01-XX

### Added
- Initial release with basic Ride with GPS API integration
- Support for User, Events, Routes, Trips, and Sync operations