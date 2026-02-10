'use client';

import { Users, Search, Filter, UserPlus } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">Coming Soon</h3>
          <p className="text-sm text-blue-700 mt-0.5">
            User management will be available in the next phase. You will be able to view, search,
            and manage all registered users from here.
          </p>
        </div>
      </div>

      {/* Sample toolbar preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
            <input
              type="text"
              placeholder="Search users..."
              disabled
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 w-64 cursor-not-allowed"
            />
          </div>
          <button
            disabled
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
        <button
          disabled
          className="inline-flex items-center gap-2 bg-gray-200 text-gray-400 font-medium py-2 px-4 rounded-lg text-sm cursor-not-allowed min-h-[40px]"
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Empty table preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-400">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Subscription</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-400">Joined</th>
                <th className="text-right px-6 py-3 font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Empty rows as preview */}
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                      <div className="w-24 h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-36 h-3 bg-gray-100 rounded animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-14 h-5 bg-gray-100 rounded-full animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-16 h-5 bg-gray-100 rounded-full animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-14 h-5 bg-gray-100 rounded-full animate-pulse" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-20 h-3 bg-gray-100 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                      <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
