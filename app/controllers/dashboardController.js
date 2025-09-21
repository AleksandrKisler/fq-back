const dashboardService = require('../services/dashboardService');

exports.getOverview = async (req, res) => {
  try {
    const {startDate, endDate} = req.query;
    const data = await dashboardService.getDashboardOverview({startDate, endDate});

    return res.json({data});
  } catch (error) {
    console.error('Dashboard overview error:', error);

    if (error.code === 'INVALID_DASHBOARD_RANGE') {
      return res.status(400).json({
        code: 'INVALID_DATE_RANGE',
        message: error.message
      });
    }

    return res.status(500).json({
      code: 'DASHBOARD_FETCH_FAILED',
      message: 'Не удалось получить данные дашборда'
    });
  }
};
