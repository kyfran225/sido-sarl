import { generateStationReport, generateGlobalReport, convertReportToCSV } from '../services/reports.service.js';
import logger from '../config/logger.js';

/**
 * Get global reports data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getReports = async (req, res) => {
  try {
    const { from, to, format } = req.query;

    // Parse date parameters
    let startDate = null;
    let endDate = null;

    if (from) {
      const parsedDate = new Date(from);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format for "from" parameter',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      // Set to start of day
      startDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      startDate.setHours(0, 0, 0, 0);
    }

    if (to) {
      const parsedDate = new Date(to);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format for "to" parameter',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      // Set to end of day
      endDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
      endDate.setHours(23, 59, 59, 999);
    }

    // Generate report
    const report = await generateGlobalReport(startDate, endDate);

    // Check if CSV export is requested
    const acceptHeader = req.headers.accept;
    const isCSVRequested = format === 'csv' || acceptHeader?.includes('text/csv');

    if (isCSVRequested) {
      // For global report, we might need a different CSV converter or handle it differently
      // For now, return JSON as CSV is not implemented for global reports
      return res.status(400).json({
        error: 'CSV export not supported for global reports yet',
        code: 'CSV_NOT_SUPPORTED'
      });
    }

    // Return JSON
    logger.info({
      format: 'json',
      userId: req.user._id
    }, 'Global report returned as JSON');

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error({
      err: error,
      userId: req.user._id
    }, 'Failed to get global report');

    res.status(500).json({
      error: 'Failed to generate global report',
      code: 'REPORT_GENERATION_FAILED'
    });
  }
};

/**
 * Get station report - JSON or CSV export
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getStationReport = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { from, to, format } = req.query;

    // Parse date parameters
    let startDate = null;
    let endDate = null;

    if (from) {
      startDate = new Date(from);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format for "from" parameter',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      // Set to start of day
      startDate.setHours(0, 0, 0, 0);
    }

    if (to) {
      endDate = new Date(to);
      if (isNaN(endDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid date format for "to" parameter',
          code: 'INVALID_DATE_FORMAT'
        });
      }
      // Set to end of day
      endDate.setHours(23, 59, 59, 999);
    }

    // Generate report
    const report = await generateStationReport(stationId, startDate, endDate);

    // Check if CSV export is requested
    const acceptHeader = req.headers.accept;
    const isCSVRequested = format === 'csv' || acceptHeader?.includes('text/csv');

    if (isCSVRequested) {
      // Return CSV
      const csvContent = convertReportToCSV(report);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="station-report-${report.stationCode}-${Date.now()}.csv"`);

      logger.info({
        stationId,
        format: 'csv',
        userId: req.user._id
      }, 'Station report exported as CSV');

      return res.send(csvContent);
    }

    // Return JSON
    logger.info({
      stationId,
      format: 'json',
      userId: req.user._id
    }, 'Station report returned as JSON');

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    if (error.message === 'Station not found') {
      return res.status(404).json({
        error: 'Station not found',
        code: 'STATION_NOT_FOUND'
      });
    }

    logger.error({
      err: error,
      stationId: req.params.stationId,
      userId: req.user._id
    }, 'Failed to get station report');

    res.status(500).json({
      error: 'Failed to generate station report',
      code: 'REPORT_GENERATION_FAILED'
    });
  }
};
