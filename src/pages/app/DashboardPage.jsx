/**
 * Dashboard Page — GarageSathi
 *
 * The main screen garage owners see after login.
 * Shows: stats cards, today's services, recent activity.
 * Designed for quick glance — no complex charts for MVP.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Wrench,
  Clock,
  CheckCircle2,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useServiceStore } from '@/stores/serviceStore';
import { getCustomerCount } from '@/services/customerService';
import { getPendingServicesCount, getCompletedServicesCount } from '@/services/serviceService';
import {
  SERVICE_STATUS_LABELS,
  SERVICE_STATUS_COLORS,
} from '@/config/constants';
import StatCard from '@/components/common/StatCard';
import Badge from '@/components/common/Badge';
import Loader from '@/components/common/Loader';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, garageId } = useAuthStore();
  const { todayServices, fetchTodayServices } = useServiceStore();

  const [stats, setStats] = useState({
    totalCustomers: 0,
    pendingCount: 0,
    completedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!garageId) return;

    async function loadDashboard() {
      setLoading(true);
      try {
        const [customerCount, pendingCount, completedCount] = await Promise.all([
          getCustomerCount(garageId),
          getPendingServicesCount(garageId),
          getCompletedServicesCount(garageId),
        ]);

        await fetchTodayServices(garageId);

        setStats({
          totalCustomers: customerCount,
          pendingCount: pendingCount,
          completedCount: completedCount,
        });
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garageId]);

  if (loading) {
    return <Loader fullPage text="Loading dashboard..." />;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Namaste, {user?.displayName?.split(' ')[0] || 'Boss'}! 🙏
        </h1>
        <p className="text-gray-500 mt-1">
          {user?.garageName || 'Your Garage'} — Today's Overview
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          color="primary"
          onClick={() => navigate('/app/customers')}
        />
        <StatCard
          title="Today"
          value={todayServices.length}
          icon={Wrench}
          color="info"
          onClick={() => navigate('/app/services')}
        />
        <StatCard
          title="Pending"
          value={stats.pendingCount}
          icon={Clock}
          color="warning"
          onClick={() => navigate('/app/services')}
        />
        <StatCard
          title="Completed"
          value={stats.completedCount}
          icon={CheckCircle2}
          color="success"
          onClick={() => navigate('/app/services')}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => navigate('/app/services/new')}
          className="btn-primary flex-1"
        >
          <Plus className="w-5 h-5" />
          New Service
        </button>
        <button
          onClick={() => navigate('/app/customers/new')}
          className="btn-secondary flex-1"
        >
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Today's Services */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Today's Services
          </h2>
          <button
            onClick={() => navigate('/app/services')}
            className="text-primary-500 text-sm font-medium flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {todayServices.length === 0 ? (
          <div className="card text-center py-8">
            <Wrench className="w-12 h-12 text-surface-400 mx-auto mb-3" />
            <p className="text-gray-500">No services today yet</p>
            <button
              onClick={() => navigate('/app/services/new')}
              className="text-primary-500 font-medium mt-2"
            >
              Create first service →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayServices.slice(0, 5).map((service) => (
              <div
                key={service.id}
                className="card flex items-center justify-between cursor-pointer active:bg-surface-50"
                onClick={() => navigate(`/app/services/${service.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {service.customerName || 'Unknown Customer'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {service.vehicleNumber} • {service.vehicleModel}
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <Badge variant={SERVICE_STATUS_COLORS[service.status] || 'neutral'}>
                    {SERVICE_STATUS_LABELS[service.status] || service.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
