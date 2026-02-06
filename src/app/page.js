// app/page.js
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { HandCoins, Coins, CreditCard, ArrowRightLeft, Check, X, BarChart3, Home, Wallet, Trophy, Users, Calendar, Brain, TrendingUp, AlertTriangle, ShoppingCart, Target, TrendingDown, Clock, Box } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [financialSummary, setFinancialSummary] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [outstandingDebtCustomers, setOutstandingDebtCustomers] = useState([]);
  const [highOrderCustomers, setHighOrderCustomers] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [orderPredictions, setOrderPredictions] = useState(null);
  const [dashboardKPI, setDashboardKPI] = useState(null);
  const [monthlyGoals, setMonthlyGoals] = useState(null);
  const [topVegetablesByWeight, setTopVegetablesByWeight] = useState([]);
  const [topVegetablesByRevenue, setTopVegetablesByRevenue] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeCustomerTab, setActiveCustomerTab] = useState('revenue');
  const [activeVegetableTab, setActiveVegetableTab] = useState('weight');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);

  // Loading states
  const [loadingFinancial, setLoadingFinancial] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingTopCustomers, setLoadingTopCustomers] = useState(true);
  const [loadingDebtCustomers, setLoadingDebtCustomers] = useState(true);
  const [loadingOrderCustomers, setLoadingOrderCustomers] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [loadingKPI, setLoadingKPI] = useState(true);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingVegetableWeight, setLoadingVegetableWeight] = useState(true);
  const [loadingVegetableRevenue, setLoadingVegetableRevenue] = useState(true);

  useEffect(() => {
    fetchFinancialSummary();
    fetchMonthlyRevenue(selectedYear);
    fetchTopCustomers();
    fetchOutstandingDebtCustomers();
    fetchHighOrderCustomers();
    fetchWeeklyStats();
    fetchOrderPredictions();
    fetchDashboardKPI();
    fetchMonthlyGoals();
    fetchTopVegetablesByWeight();
    fetchTopVegetablesByRevenue();

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Re-fetch monthly revenue when year changes
  useEffect(() => {
    fetchMonthlyRevenue(selectedYear);
  }, [selectedYear]);




  const fetchFinancialSummary = async () => {
    try {
      setLoadingFinancial(true);
      console.log('Fetching financial summary...');
      const startTime = Date.now();

      const response = await axios.get('/api/financial-summary');

      const endTime = Date.now();
      console.log(`Financial summary fetched in ${endTime - startTime}ms`);

      setFinancialSummary(response.data);

    } catch (error) {
      console.error('Failed to fetch financial summary:', error);
    } finally {
      setLoadingFinancial(false);
    }
  };

  const fetchMonthlyRevenue = async (year) => {
    try {
      setLoadingRevenue(true);
      const response = await axios.get(`/api/monthly-revenue${year ? `?year=${year}` : ''}`);
      setMonthlyRevenue(response.data.data);
      if (response.data.availableYears?.length > 0) {
        setAvailableYears(response.data.availableYears);
      }
    } catch (error) {
      console.error('Failed to fetch monthly revenue:', error);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const fetchTopCustomers = async () => {
    try {
      setLoadingTopCustomers(true);
      console.log('Fetching top customers...');
      const response = await axios.get('/api/customers/top-revenue');
      setTopCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch top customers:', error);
    } finally {
      setLoadingTopCustomers(false);
    }
  };

  const fetchOutstandingDebtCustomers = async () => {
    try {
      setLoadingDebtCustomers(true);
      console.log('Fetching outstanding debt customers...');
      const response = await axios.get('/api/customers/top-debt');
      setOutstandingDebtCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch outstanding debt customers:', error);
    } finally {
      setLoadingDebtCustomers(false);
    }
  };

  const fetchHighOrderCustomers = async () => {
    try {
      setLoadingOrderCustomers(true);
      console.log('Fetching high order customers...');
      const response = await axios.get('/api/customers/top-orders');
      setHighOrderCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to fetch high order customers:', error);
    } finally {
      setLoadingOrderCustomers(false);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      setLoadingWeekly(true);
      console.log('Fetching weekly statistics...');
      const response = await axios.get('/api/orders/weekly-stats');
      setWeeklyStats(response.data.weeklyStats || []);
    } catch (error) {
      console.error('Failed to fetch weekly statistics:', error);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const fetchOrderPredictions = async () => {
    try {
      setLoadingPredictions(true);
      console.log('Fetching order predictions...');
      const response = await axios.get('/api/orders/predictions');
      setOrderPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch order predictions:', error);
    } finally {
      setLoadingPredictions(false);
    }
  };

  const fetchDashboardKPI = async () => {
    try {
      setLoadingKPI(true);
      console.log('Fetching dashboard KPI...');
      const response = await axios.get('/api/dashboard/kpi');
      setDashboardKPI(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard KPI:', error);
    } finally {
      setLoadingKPI(false);
    }
  };

  const fetchMonthlyGoals = async () => {
    try {
      setLoadingGoals(true);
      console.log('Fetching monthly goals...');
      const response = await axios.get('/api/dashboard/goals');
      setMonthlyGoals(response.data);
    } catch (error) {
      console.error('Failed to fetch monthly goals:', error);
    } finally {
      setLoadingGoals(false);
    }
  };

  const formatMoney = (amount) => {
    return Math.round(amount).toLocaleString();
  };

  const formatWeight = (weight) => {
    return weight % 1 === 0 ? weight.toString() : weight.toFixed(2);
  };

  const fetchTopVegetablesByWeight = async () => {
    try {
      setLoadingVegetableWeight(true);
      const response = await axios.get('/api/vegetables/top-weight');
      setTopVegetablesByWeight(response.data.vegetables || []);
    } catch (error) {
      console.error('Failed to fetch top vegetables by weight:', error);
    } finally {
      setLoadingVegetableWeight(false);
    }
  };

  const fetchTopVegetablesByRevenue = async () => {
    try {
      setLoadingVegetableRevenue(true);
      const response = await axios.get('/api/vegetables/top-revenue');
      setTopVegetablesByRevenue(response.data.vegetables || []);
    } catch (error) {
      console.error('Failed to fetch top vegetables by revenue:', error);
    } finally {
      setLoadingVegetableRevenue(false);
    }
  };

  // Skeleton Loading Components
  const SkeletonCard = ({ height = "h-4" }) => (
    <div className={`${height} bg-gray-200 rounded animate-pulse`}></div>
  );

  const SkeletonFinancialCard = () => (
    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );

  const SkeletonCustomerRow = () => (
    <div className="flex items-center justify-between p-1.5 rounded border bg-gray-50 border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
    </div>
  );

  const SkeletonVegetableRow = () => (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 border-gray-200">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="flex-1 min-w-0">
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );



  return (
    <>
      {/* Mobile Fixed Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white px-4 py-3 z-40 border-b border-gray-200">
        <div className="flex items-center">
          <h1 className="text-xl font-extralight text-black">หน้าหลัก</h1>
        </div>
      </div>

      <div className="w-full px-0 sm:px-4 overflow-hidden">

        {/* KPI Cards Section */}
        {loadingKPI ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="w-10 h-5 bg-gray-100 rounded animate-pulse"></div>
                </div>
                <div className="w-14 h-7 bg-gray-100 rounded animate-pulse mb-1"></div>
                <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : dashboardKPI && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            {/* Total Customers */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-700" />
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-extralight ${
                  dashboardKPI.customerGrowth >= 0 ? 'bg-gray-100 text-black' : 'bg-gray-800 text-white'
                }`}>
                  {dashboardKPI.customerGrowth === -100 ? '0%' :
                   dashboardKPI.customerGrowth >= 0 ? `+${Math.round(dashboardKPI.customerGrowth)}%` :
                   `${Math.round(dashboardKPI.customerGrowth)}%`}
                </div>
              </div>
              <div className="text-2xl font-extralight text-black mb-1">{dashboardKPI.totalCustomers}</div>
              <div className="text-sm text-gray-500">ลูกค้าทั้งหมด</div>
            </div>

            {/* Today's Orders */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-gray-700" />
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-extralight ${
                  dashboardKPI.todayOrdersGrowth >= 0 ? 'bg-gray-100 text-black' : 'bg-gray-800 text-white'
                }`}>
                  {dashboardKPI.todayOrdersGrowth === -100 ? '0%' :
                   dashboardKPI.todayOrdersGrowth >= 0 ? `+${Math.round(dashboardKPI.todayOrdersGrowth)}%` :
                   `${Math.round(dashboardKPI.todayOrdersGrowth)}%`}
                </div>
              </div>
              <div className="text-2xl font-extralight text-black mb-1">{dashboardKPI.todayOrders}</div>
              <div className="text-sm text-gray-500">ออเดอร์วันนี้</div>
            </div>

            {/* Today's Revenue */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <HandCoins className="w-5 h-5 text-gray-700" />
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-extralight ${
                  dashboardKPI.todayRevenueGrowth >= 0 ? 'bg-gray-100 text-black' : 'bg-gray-800 text-white'
                }`}>
                  {dashboardKPI.todayRevenueGrowth === -100 ? '0%' :
                   dashboardKPI.todayRevenueGrowth >= 0 ? `+${Math.round(dashboardKPI.todayRevenueGrowth)}%` :
                   `${Math.round(dashboardKPI.todayRevenueGrowth)}%`}
                </div>
              </div>
              <div className="text-2xl font-extralight text-black mb-1">{formatMoney(dashboardKPI.todayRevenue)}฿</div>
              <div className="text-sm text-gray-500">รายได้วันนี้</div>
            </div>

            {/* Average Daily Weight */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-gray-700" />
                </div>
                <div className={`text-xs px-2 py-1 rounded-full font-extralight ${
                  dashboardKPI.dailyWeightGrowth >= 0 ? 'bg-gray-100 text-black' : 'bg-gray-800 text-white'
                }`}>
                  {dashboardKPI.dailyWeightGrowth === -100 ? '0%' :
                   dashboardKPI.dailyWeightGrowth >= 0 ? `+${Math.round(dashboardKPI.dailyWeightGrowth)}%` :
                   `${Math.round(dashboardKPI.dailyWeightGrowth)}%`}
                </div>
              </div>
              <div className="text-2xl font-extralight text-black mb-1">{dashboardKPI.avgDailyWeight} กก.</div>
              <div className="text-sm text-gray-500">เฉลี่ยสั่งต่อวัน</div>
            </div>
          </div>
        )}

        {/* Goals & Targets Section */}
        {loadingGoals ? (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-100 rounded animate-pulse mr-3"></div>
                <div className="w-32 h-5 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse"></div>
                  <div className="flex justify-between">
                    <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="w-24 h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse"></div>
                  <div className="flex justify-between">
                    <div className="w-16 h-4 bg-gray-100 rounded animate-pulse"></div>
                    <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : monthlyGoals && (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Target className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">เป้าหมายประจำเดือน</h2>
              </div>
              <span className="text-sm text-gray-500">{new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Goal */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extralight text-black">เป้าหมายรายได้</span>
                    <span className="text-sm text-gray-600">{Math.round((monthlyGoals.revenueActual / monthlyGoals.revenueTarget) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-500"
                      style={{ width: `${Math.min((monthlyGoals.revenueActual / monthlyGoals.revenueTarget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black font-extralight">{formatMoney(monthlyGoals.revenueActual)}฿</span>
                    <span className="text-gray-500">/ {formatMoney(monthlyGoals.revenueTarget)}฿</span>
                  </div>
                </div>

                {/* Orders Goal */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extralight text-black">เป้าหมายออเดอร์</span>
                    <span className="text-sm text-gray-600">{Math.round((monthlyGoals.ordersActual / monthlyGoals.ordersTarget) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-800 transition-all duration-500"
                      style={{ width: `${Math.min((monthlyGoals.ordersActual / monthlyGoals.ordersTarget) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-black font-extralight">{monthlyGoals.ordersActual}</span>
                    <span className="text-gray-500">/ {monthlyGoals.ordersTarget} ออเดอร์</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Performance Card */}
        {loadingFinancial ? (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Wallet className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">สรุปการเงิน</h2>
              </div>
            </div>

            <div className="p-4">
              {/* Summary Cards Skeleton */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <SkeletonFinancialCard />
                <SkeletonFinancialCard />
                <SkeletonFinancialCard />
              </div>

              {/* Payment Methods Skeleton */}
              <div className="mt-4">
                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                    <div className="flex justify-between">
                      <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                    <div className="flex justify-between">
                      <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="w-12 h-3 bg-gray-200 rounded animate-pulse mb-1"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                    <div className="flex justify-between">
                      <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-10 h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : financialSummary && (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Wallet className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">สรุปการเงิน</h2>
              </div>
            </div>

            <div className="p-4">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Total Revenue Card */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <HandCoins className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-500">รายได้</span>
                  </div>
                  <div className="text-xl font-extralight text-black">{formatMoney(financialSummary.totalRevenue)}</div>
                </div>

                {/* Paid Amount Card */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Check className="w-5 h-5 text-gray-700" />
                    <span className="text-sm text-gray-500">ชำระแล้ว</span>
                  </div>
                  <div className="text-xl font-extralight text-black">{formatMoney(financialSummary.paidAmount)}</div>
                </div>

                {/* Unpaid Amount Card */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <X className="w-5 h-5 text-gray-700" />
                    <span className="text-sm text-gray-500">ยังไม่ชำระ</span>
                  </div>
                  <div className="text-xl font-extralight text-black">{formatMoney(financialSummary.unpaidAmount)}</div>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="mt-4">
                <div className="text-sm font-extralight text-black mb-3">แยกตามวิธีชำระเงิน</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(financialSummary.paymentMethodBreakdown).map(([method, amounts]) => {
                    const total = amounts.paid + amounts.unpaid;
                    if (total === 0) return null;
                    
                    const methodName = method === 'cash' ? 'เงินสด' 
                                     : method === 'credit' ? 'เครดิต' 
                                     : 'เงินโอน';
                    
                    const icon = method === 'cash' ? <Coins className="w-4 h-4" />
                              : method === 'credit' ? <CreditCard className="w-4 h-4" />
                              : <ArrowRightLeft className="w-4 h-4" />;
                    
                    const paidPercent = Math.round((amounts.paid / total) * 100);
                    
                    return (
                      <div key={method} className="bg-white rounded-lg border border-gray-200 p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extralight text-xs text-gray-600">{methodName}</div>
                            <div className="text-base font-extralight truncate">{formatMoney(total)}</div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-700 transition-all duration-500"
                            style={{ width: `${paidPercent}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between mt-2 text-xs">
                          <span className="text-black">{formatMoney(amounts.paid)}</span>
                          <span className="text-red-600">{formatMoney(amounts.unpaid)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Monthly Revenue Chart - Show loading or data */}
        {loadingRevenue ? (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">ภาพรวมธุรกิจ {new Date().getFullYear()}</h2>
              </div>
            </div>

            <div className="p-4 sm:p-4 px-0 sm:px-4">
              {/* Legend Skeleton */}
              <div className="flex items-center justify-end gap-3 mb-3 px-4 sm:px-0">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-[2px] bg-gray-200 animate-pulse"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Chart Skeleton */}
              <div className="h-64 sm:h-80 bg-gray-50 rounded flex items-end justify-around px-4 py-4 sm:p-4">
                {[65, 45, 80, 35, 55, 70, 40, 90, 50, 75, 60, 85].map((h, i) => (
                  <div key={i} className="flex flex-col items-center space-y-1">
                    <div className="w-6 bg-gray-200 rounded animate-pulse" style={{height: `${h}%`}}></div>
                    <div className="w-8 h-2 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : monthlyRevenue.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <BarChart3 className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">ภาพรวมธุรกิจ</h2>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="p-4 sm:p-4 px-0 sm:px-4">
              {/* Legend Section */}
              <div className="flex items-center justify-end gap-4 mb-3 px-4 sm:px-0">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-800"></div>
                  <span className="text-sm text-gray-600">รายได้ (บาท)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded bg-emerald-500"></div>
                  <span className="text-sm text-gray-600">น้ำหนัก (กก.)</span>
                </div>
              </div>

              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={monthlyRevenue}
                    margin={{
                      top: isMobile ? 25 : 40,
                      right: isMobile ? 5 : 40,
                      left: isMobile ? 0 : 20,
                      bottom: isMobile ? 5 : 20
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={isMobile ? 25 : 40}
                    />
                    {/* แสดง YAxis สำหรับรายได้ด้านซ้าย */}
                    <YAxis
                      yAxisId="revenue"
                      orientation="left"
                      tickFormatter={(value) => `${(value/1000)}k`}
                      stroke="#374151"
                      fontSize={isMobile ? 10 : 12}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                    />
                    {/* แสดง YAxis สำหรับน้ำหนักด้านขวา */}
                    <YAxis
                      yAxisId="weight"
                      orientation="right"
                      tickFormatter={(value) => `${value}`}
                      stroke="#10b981"
                      fontSize={isMobile ? 10 : 12}
                      tick={{ fontSize: isMobile ? 10 : 12, fill: '#10b981' }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'revenue') {
                          return [formatMoney(value) + ' บาท', 'รายได้'];
                        } else if (name === 'totalWeight') {
                          return [formatWeight(value) + ' กก.', 'น้ำหนัก'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const month = monthlyRevenue.find(m => m.month === label);
                        return month ? month.monthName : label;
                      }}
                      labelStyle={{ color: '#000', fontWeight: 500 }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    {/* แสดงรายได้เป็นแท่ง */}
                    <Bar
                      yAxisId="revenue"
                      dataKey="revenue"
                      name="revenue"
                      fill="#374151"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'inside',
                        fontSize: isMobile ? 8 : 11,
                        fill: '#fff',
                        fontWeight: 500,
                        formatter: (value) => value > 0 ? (isMobile ? `${Math.round(value/1000)}k` : formatMoney(value)) : ''
                      }}
                    />
                    {/* แสดงน้ำหนักเป็นเส้น */}
                    <Line
                      yAxisId="weight"
                      type="monotone"
                      dataKey="totalWeight"
                      name="totalWeight"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{
                        fill: '#10b981',
                        strokeWidth: 2,
                        r: 5,
                        stroke: '#fff'
                      }}
                      activeDot={{
                        fill: '#10b981',
                        strokeWidth: 2,
                        r: 7,
                        stroke: '#fff'
                      }}
                      label={{
                        position: 'top',
                        fontSize: isMobile ? 9 : 12,
                        fill: '#059669',
                        fontWeight: 600,
                        offset: isMobile ? 8 : 12,
                        formatter: (value) => value > 0 ? `${formatWeight(value)}` : ''
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Average Orders & Weight Per Day Chart */}
        {!loadingRevenue && monthlyRevenue.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <ShoppingCart className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">เฉลี่ยต่อวัน</h2>
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="p-4 sm:p-4 px-0 sm:px-4">
              {/* Legend */}
              <div className="flex items-center justify-end gap-4 mb-3 px-4 sm:px-0">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-900"></div>
                  <span className="text-sm text-gray-600">ออเดอร์/วัน</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 rounded bg-amber-500"></div>
                  <span className="text-sm text-gray-600">กก./วัน</span>
                </div>
              </div>

              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={monthlyRevenue}
                    margin={{
                      top: isMobile ? 25 : 40,
                      right: isMobile ? 5 : 40,
                      left: isMobile ? 0 : 20,
                      bottom: isMobile ? 5 : 20
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      horizontal={true}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={isMobile ? 25 : 40}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="left"
                      tick={{ fontSize: isMobile ? 10 : 12, fill: '#111827' }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      stroke="#111827"
                      domain={[0, 'auto']}
                    />
                    <YAxis
                      yAxisId="weight"
                      orientation="right"
                      tick={{ fontSize: isMobile ? 10 : 12, fill: '#f59e0b' }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      tickLine={{ stroke: '#e0e0e0' }}
                      stroke="#f59e0b"
                      domain={[0, 'auto']}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'avgOrdersPerDay') {
                          return [value + ' ออเดอร์', 'เฉลี่ยออเดอร์/วัน'];
                        } else if (name === 'avgWeightPerDay') {
                          return [value + ' กก.', 'เฉลี่ย กก./วัน'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const month = monthlyRevenue.find(m => m.month === label);
                        return month ? month.monthName : label;
                      }}
                      labelStyle={{ color: '#000', fontWeight: 500 }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar
                      yAxisId="orders"
                      dataKey="avgOrdersPerDay"
                      name="avgOrdersPerDay"
                      fill="#111827"
                      radius={[4, 4, 0, 0]}
                      label={{
                        position: 'inside',
                        fontSize: isMobile ? 10 : 12,
                        fill: '#fff',
                        fontWeight: 600,
                        formatter: (value) => value > 0 ? value : ''
                      }}
                    />
                    <Line
                      yAxisId="weight"
                      type="monotone"
                      dataKey="avgWeightPerDay"
                      name="avgWeightPerDay"
                      stroke="#f59e0b"
                      strokeWidth={3}
                      dot={{
                        fill: '#f59e0b',
                        strokeWidth: 2,
                        r: 5,
                        stroke: '#fff'
                      }}
                      activeDot={{
                        fill: '#f59e0b',
                        strokeWidth: 2,
                        r: 7,
                        stroke: '#fff'
                      }}
                      label={{
                        position: 'top',
                        fontSize: isMobile ? 9 : 12,
                        fill: '#d97706',
                        fontWeight: 600,
                        offset: isMobile ? 8 : 12,
                        formatter: (value) => value > 0 ? `${value}` : ''
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Order Predictions */}
        {loadingPredictions ? (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-100 rounded animate-pulse mr-3"></div>
                <div className="w-40 h-5 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
                <div className="w-24 h-5 bg-gray-100 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="p-4">
              {/* Top Predicted Vegetables Skeleton */}
              <div className="mb-6">
                <div className="w-40 h-5 bg-gray-100 rounded animate-pulse mb-3"></div>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <div className="w-24 h-4 bg-gray-100 rounded animate-pulse mb-2"></div>
                      <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Customers Skeleton */}
              <div className="w-48 h-5 bg-gray-100 rounded animate-pulse mb-3"></div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="border border-gray-100 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="w-32 h-5 bg-gray-100 rounded animate-pulse mb-2"></div>
                        <div className="w-40 h-4 bg-gray-100 rounded animate-pulse mb-2"></div>
                        <div className="w-24 h-5 bg-gray-100 rounded animate-pulse"></div>
                      </div>
                      <div className="w-16 h-7 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                    <div className="w-36 h-4 bg-gray-100 rounded animate-pulse mb-3"></div>
                    <div className="space-y-2">
                      <div className="w-full h-8 bg-gray-100 rounded animate-pulse"></div>
                      <div className="w-4/5 h-8 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : orderPredictions && orderPredictions.customerPredictions && orderPredictions.customerPredictions.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Brain className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">คาดการณ์ออเดอร์ครั้งถัดไป</h2>
              </div>
              <div className="text-sm text-gray-500">
                {orderPredictions.dayOfWeek.name} ({new Date(orderPredictions.predictionDate).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                })})
                {orderPredictions.daysSkipped > 0 && (
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    ข้าม {orderPredictions.daysSkipped} วันหยุด
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              {/* Top Predicted Vegetables */}
              {orderPredictions.overallVegetableDemand && orderPredictions.overallVegetableDemand.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-extralight text-black mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    สินค้าที่คาดว่าจะได้รับความนิยม
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {orderPredictions.overallVegetableDemand.slice(0, 8).map((veg, index) => (
                      <div key={index} className={`border rounded-lg p-3 ${
                        veg.isHistoricalEstimate ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100 shadow-sm'
                      }`}>
                        <div className="font-extralight text-sm text-black">{veg.vegetableName}</div>
                        <div className={`text-sm ${
                          veg.isHistoricalEstimate ? 'text-gray-600' : 'text-black'
                        }`}>
                          {veg.predictedQuantity} กก.
                          {veg.customerCount > 0 && (
                            <span className="text-gray-500"> ({veg.customerCount} ลูกค้า)</span>
                          )}
                          {veg.isHistoricalEstimate && (
                            <span className="text-gray-500"> (ประมาณการ)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High Probability Customers */}
              <div className="text-sm font-extralight text-black mb-3">
                ลูกค้าที่มีโอกาสสั่งสูง ({orderPredictions.totalCustomersWithPredictions} ราย)
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto">
                {orderPredictions.customerPredictions.map((customer, index) => (
                  <div key={index} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    {/* Customer Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-extralight text-sm text-black">{customer.customerName}</div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>โอกาส {customer.orderProbability}%</span>
                          <span>•</span>
                          <span>{orderPredictions.dayOfWeek.name} {customer.dayOfWeekFrequency}%</span>
                          <span>•</span>
                          <span>{customer.daysSinceLastOrder} วันที่แล้ว</span>
                        </div>
                        {customer.totalPredictedQuantity > 0 && (
                          <div className="text-sm font-extralight text-black mt-1">
                            รวม: {customer.totalPredictedQuantity} กก.
                          </div>
                        )}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-extralight ${
                        customer.orderProbability >= 50 ? 'bg-black text-white' :
                        customer.orderProbability >= 30 ? 'bg-gray-800 text-white' :
                        'bg-gray-100 text-black'
                      }`}>
                        {customer.orderProbability >= 50 ? 'สูง' :
                         customer.orderProbability >= 30 ? 'ปานกลาง' : 'น่าสนใจ'}
                      </div>
                    </div>

                    {/* Ordering Pattern Info */}
                    <div className="text-sm text-gray-500 mb-3">
                      รอบการสั่ง: ทุก {customer.orderingCycleDays} วัน •
                      {orderPredictions.dayOfWeek.name}เคยสั่ง {customer.sameDayHistoricalOrders} ครั้ง จาก {customer.totalOrders} ครั้งทั้งหมด
                    </div>

                    {/* Vegetable Predictions */}
                    {customer.predictions && customer.predictions.length > 0 && (
                      <div className="space-y-2">
                        {(() => {
                          // แยกผักออกเป็น 2 กลุ่ม
                          const regularVegetables = customer.predictions.filter(pred =>
                            pred.totalOrders >= 5 && pred.sameDayOrders >= 2
                          );
                          const occasionalVegetables = customer.predictions.filter(pred =>
                            pred.totalOrders < 5 || pred.sameDayOrders < 2
                          );

                          return (
                            <>
                              {/* ผักสั่งประจำ */}
                              {regularVegetables.length > 0 && (
                                <div>
                                  <div className="text-sm font-extralight text-black mb-2">สินค้าสั่งประจำ:</div>
                                  <div className="space-y-2">
                                    {regularVegetables.map((pred, predIndex) => (
                                      <div key={predIndex} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                        <span className="text-black font-extralight">{pred.vegetableName}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-black">{pred.predictedQuantity} กก.</span>
                                          <span className="text-xs text-gray-500">
                                            {pred.sameDayOrders}/{pred.totalOrders}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* ผักนานๆ ทีสั่ง */}
                              {occasionalVegetables.length > 0 && (
                                <div>
                                  <div className="text-sm font-extralight text-black mb-2">นานๆ ทีสั่ง:</div>
                                  <div className="space-y-2">
                                    {occasionalVegetables.map((pred, predIndex) => (
                                      <div key={predIndex} className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                                        <span className="text-black">{pred.vegetableName}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-gray-600">{pred.predictedQuantity} กก.</span>
                                          <span className="text-gray-500 text-xs">
                                            {pred.sameDayOrders === 0 ? 'ไม่ต้องเตรียม' :
                                             pred.totalOrders <= 2 ? 'เตรียมน้อย' :
                                             pred.sameDayOrders === 1 && pred.totalOrders >= 5 ? 'เตรียมสำรอง' : 'เตรียมน้อย'}
                                          </span>
                                          <span className="text-xs text-gray-400">
                                            {pred.sameDayOrders}/{pred.totalOrders}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Prediction Summary */}
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">
                    รวมการคาดการณ์: {orderPredictions.customerPredictions.reduce((sum, c) => sum + c.predictions.length, 0)} รายการ
                  </span>
                  <span className="text-gray-600">
                    พรุ่งนี้: {orderPredictions.dayOfWeek.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Order Statistics */}
        {loadingWeekly ? (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-100 rounded animate-pulse mr-3"></div>
                <div className="w-36 h-5 bg-gray-100 rounded animate-pulse"></div>
              </div>
              <div className="w-20 h-4 bg-gray-100 rounded animate-pulse"></div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2 text-center">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-gray-50 border-gray-100">
                    <div className="w-10 h-4 bg-gray-100 rounded animate-pulse mb-3 mx-auto"></div>
                    <div className="w-8 h-8 bg-gray-100 rounded animate-pulse mb-2 mx-auto"></div>
                    <div className="w-12 h-4 bg-gray-100 rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
              </div>
              {/* Summary Skeleton */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="w-40 h-5 bg-gray-100 rounded animate-pulse"></div>
                  <div className="w-32 h-5 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ) : weeklyStats.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-lg mb-3 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">สถิติออเดอร์รายวัน</h2>
              </div>
              <span className="text-sm text-gray-500">เฉลี่ย/วัน</span>
            </div>

            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                {weeklyStats.map((dayStat, index) => {
                  const isHighest = weeklyStats.reduce((max, curr) =>
                    curr.averageOrdersPerDay > max ? curr.averageOrdersPerDay : max, 0) === dayStat.averageOrdersPerDay;

                  return (
                    <div key={index} className={`p-1.5 sm:p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                      isHighest && dayStat.averageOrdersPerDay > 0
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-white border-gray-100'
                    }`}>
                      {/* Day name */}
                      <div className="text-xs sm:text-sm font-extralight text-black mb-1 sm:mb-2">
                        {dayStat.dayName.th}
                      </div>

                      {/* Average orders */}
                      <div className={`text-lg sm:text-2xl font-extralight mb-0.5 sm:mb-1 ${
                        isHighest && dayStat.averageOrdersPerDay > 0 ? 'text-black' : 'text-black'
                      }`}>
                        {dayStat.averageOrdersPerDay}
                      </div>

                      {/* Total orders */}
                      <div className="text-xs sm:text-sm text-gray-500">
                        {dayStat.totalOrders}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 text-xs sm:text-sm">
                  <span className="text-gray-600">
                    วันที่มีออเดอร์มากที่สุด:
                    <span className="font-extralight text-black ml-1">
                      {weeklyStats.reduce((max, curr) =>
                        curr.averageOrdersPerDay > max.averageOrdersPerDay ? curr : max,
                        { averageOrdersPerDay: 0, dayName: { th: '-' } }
                      ).dayName.th}
                    </span>
                  </span>
                  <span className="text-gray-600">
                    เฉลี่ย: <span className="font-extralight text-black">
                      {(weeklyStats.reduce((sum, day) => sum + day.averageOrdersPerDay, 0) / 7).toFixed(1)} ออเดอร์/วัน
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rankings Section - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
          {/* Top Vegetables Rankings */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center">
                <Box className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-lg font-extralight text-black">สินค้าขายดี</h2>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveVegetableTab('weight')}
                className={`flex-1 px-4 py-3 text-sm font-extralight transition-all ${
                  activeVegetableTab === 'weight'
                    ? 'bg-gray-50 text-black border-b-2 border-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                จำนวน
              </button>
              <button
                onClick={() => setActiveVegetableTab('revenue')}
                className={`flex-1 px-4 py-3 text-sm font-extralight transition-all ${
                  activeVegetableTab === 'revenue'
                    ? 'bg-gray-50 text-black border-b-2 border-black'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                }`}
              >
                <HandCoins className="w-4 h-4 inline mr-2" />
                รายได้
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {/* Weight Tab */}
              {activeVegetableTab === 'weight' && (
                loadingVegetableWeight ? (
                  <div className="space-y-1">
                    {[...Array(10)].map((_, i) => (
                      <SkeletonVegetableRow key={i} />
                    ))}
                  </div>
                ) : topVegetablesByWeight.length > 0 ? (
                  <div className="space-y-2">
                    {topVegetablesByWeight.slice(0, 10).map((vegetable, index) => {
                      const rank = index + 1;
                      const isTopThree = rank <= 3;

                      return (
                        <div key={vegetable.vegetableName} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                          isTopThree ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center text-sm font-extralight rounded-lg ${
                              rank === 1 ? 'bg-black text-white' :
                              rank === 2 ? 'bg-gray-800 text-white' :
                              rank === 3 ? 'bg-gray-600 text-white' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-extralight text-sm text-black truncate">{vegetable.vegetableName}</div>
                              <div className="text-sm text-gray-500">{vegetable.orderCount} ออเดอร์</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extralight text-sm text-black">
                              {formatWeight(vegetable.totalWeight)} กก.
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatMoney(vegetable.totalRevenue)}฿
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล</div>
                )
              )}

              {/* Revenue Tab */}
              {activeVegetableTab === 'revenue' && (
                loadingVegetableRevenue ? (
                  <div className="space-y-1">
                    {[...Array(10)].map((_, i) => (
                      <SkeletonVegetableRow key={i} />
                    ))}
                  </div>
                ) : topVegetablesByRevenue.length > 0 ? (
                  <div className="space-y-2">
                    {topVegetablesByRevenue.slice(0, 10).map((vegetable, index) => {
                      const rank = index + 1;
                      const isTopThree = rank <= 3;

                      return (
                        <div key={vegetable.vegetableName} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                          isTopThree ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center text-sm font-extralight rounded-lg ${
                              rank === 1 ? 'bg-black text-white' :
                              rank === 2 ? 'bg-gray-800 text-white' :
                              rank === 3 ? 'bg-gray-600 text-white' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {rank}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-extralight text-sm text-black truncate">{vegetable.vegetableName}</div>
                              <div className="text-sm text-gray-500">
                                {formatWeight(vegetable.totalWeight)} กก. · {vegetable.orderCount} ออเดอร์
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-extralight text-sm text-black">
                              {formatMoney(vegetable.totalRevenue)}฿
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatMoney(vegetable.avgPricePerKg)}฿/กก.
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล</div>
                )
              )}
            </div>
          </div>

          {/* Customer Rankings - Unified Section with Tabs */}
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-gray-700 mr-3" />
              <h2 className="text-lg font-extralight text-black">ลูกค้าอันดับต้น</h2>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveCustomerTab('revenue')}
              className={`flex-1 px-4 py-3 text-sm font-extralight transition-all ${
                activeCustomerTab === 'revenue'
                  ? 'bg-gray-50 text-black border-b-2 border-black'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              รายได้
            </button>
            <button
              onClick={() => setActiveCustomerTab('debt')}
              className={`flex-1 px-4 py-3 text-sm font-extralight transition-all ${
                activeCustomerTab === 'debt'
                  ? 'bg-gray-50 text-black border-b-2 border-black'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              หนี้ค้าง
            </button>
            <button
              onClick={() => setActiveCustomerTab('orders')}
              className={`flex-1 px-4 py-3 text-sm font-extralight transition-all ${
                activeCustomerTab === 'orders'
                  ? 'bg-gray-50 text-black border-b-2 border-black'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-black'
              }`}
            >
              <ShoppingCart className="w-4 h-4 inline mr-2" />
              สั่งบ่อย
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {/* Revenue Tab */}
            {activeCustomerTab === 'revenue' && (
              loadingTopCustomers ? (
                <div className="space-y-1">
                  {[...Array(10)].map((_, i) => (
                    <SkeletonCustomerRow key={i} />
                  ))}
                </div>
              ) : topCustomers.length > 0 ? (
                <div className="space-y-2">
                  {topCustomers.slice(0, 10).map((customer, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <div key={customer._id} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                        isTopThree ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center text-sm font-extralight rounded-lg ${
                            rank === 1 ? 'bg-black text-white' :
                            rank === 2 ? 'bg-gray-800 text-white' :
                            rank === 3 ? 'bg-gray-600 text-white' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extralight text-sm text-black truncate">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.orderCount} ออเดอร์</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extralight text-sm text-black">
                            {formatMoney(customer.totalRevenue)}฿
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatWeight(customer.totalWeight)} กก.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล</div>
              )
            )}

            {/* Debt Tab */}
            {activeCustomerTab === 'debt' && (
              loadingDebtCustomers ? (
                <div className="space-y-1">
                  {[...Array(10)].map((_, i) => (
                    <SkeletonCustomerRow key={i} />
                  ))}
                </div>
              ) : outstandingDebtCustomers.length > 0 ? (
                <div className="space-y-2">
                  {outstandingDebtCustomers.slice(0, 10).map((customer, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <div key={customer._id} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                        isTopThree ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center text-sm font-extralight rounded-lg ${
                            rank === 1 ? 'bg-black text-white' :
                            rank === 2 ? 'bg-gray-800 text-white' :
                            rank === 3 ? 'bg-gray-600 text-white' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extralight text-sm text-black truncate">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.unpaidOrders} ออเดอร์ค้าง</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extralight text-sm text-black">
                            {formatMoney(customer.unpaidAmount)}฿
                          </div>
                          <div className="text-sm text-gray-500">ค้างชำระ</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีหนี้ค้าง</div>
              )
            )}

            {/* Orders Tab */}
            {activeCustomerTab === 'orders' && (
              loadingOrderCustomers ? (
                <div className="space-y-1">
                  {[...Array(10)].map((_, i) => (
                    <SkeletonCustomerRow key={i} />
                  ))}
                </div>
              ) : highOrderCustomers.length > 0 ? (
                <div className="space-y-2">
                  {highOrderCustomers.slice(0, 10).map((customer, index) => {
                    const rank = index + 1;
                    const isTopThree = rank <= 3;

                    return (
                      <div key={customer._id} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${
                        isTopThree ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 flex items-center justify-center text-sm font-extralight rounded-lg ${
                            rank === 1 ? 'bg-black text-white' :
                            rank === 2 ? 'bg-gray-800 text-white' :
                            rank === 3 ? 'bg-gray-600 text-white' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {rank}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extralight text-sm text-black truncate">{customer.name}</div>
                            <div className="text-sm text-gray-500">
                              รายได้ {formatMoney(customer.totalRevenue)}฿
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extralight text-sm text-black">
                            {customer.orderCount} ครั้ง
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatWeight(customer.totalWeight)} กก.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">ไม่มีข้อมูล</div>
              )
            )}
          </div>
        </div>
        </div>

      </div>
    </>
  );
}