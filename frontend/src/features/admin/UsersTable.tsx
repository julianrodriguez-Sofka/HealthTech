/**
 * UsersTable - Tabla de usuarios registrados
 */

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  specialty?: string;
  licenseNumber?: string;
  area?: string;
  shift?: string;
  currentPatientLoad?: number;
  maxPatientLoad?: number;
  createdAt: string;
}

interface UsersTableProps {
  users: User[];
  onUpdate: () => void;
}

export function UsersTable({ users }: UsersTableProps) {
  const getRoleBadge = (role: string) => {
    const badges = {
      doctor: 'bg-blue-100 text-blue-800',
      nurse: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getSpecialtyLabel = (specialty?: string) => {
    const labels: Record<string, string> = {
      emergency_medicine: 'Medicina de Emergencias',
      internal_medicine: 'Medicina Interna',
      surgery: 'Cirugía',
      pediatrics: 'Pediatría',
      cardiology: 'Cardiología',
      neurology: 'Neurología'
    };
    return specialty ? labels[specialty] || specialty : '-';
  };

  const getAreaLabel = (area?: string) => {
    const labels: Record<string, string> = {
      triage: 'Triage',
      emergency_room: 'Sala de Emergencias',
      intensive_care: 'Cuidados Intensivos'
    };
    return area ? labels[area] || area : '-';
  };

  const getShiftLabel = (shift?: string) => {
    const labels: Record<string, string> = {
      morning: 'Mañana',
      afternoon: 'Tarde',
      night: 'Noche'
    };
    return shift ? labels[shift] || shift : '-';
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 text-5xl mb-4">👥</div>
        <p className="text-gray-600">No hay usuarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Usuario
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rol
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Detalles
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Licencia
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Carga
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                  {user.role === 'doctor' ? '👨‍⚕️ Doctor' : '👩‍⚕️ Enfermero'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                  {user.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {user.role === 'doctor' && (
                    <div>
                      <div className="font-medium">{getSpecialtyLabel(user.specialty)}</div>
                    </div>
                  )}
                  {user.role === 'nurse' && (
                    <div>
                      <div>{getAreaLabel(user.area)}</div>
                      <div className="text-xs text-gray-500">Turno: {getShiftLabel(user.shift)}</div>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.licenseNumber || '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.role === 'doctor' && (
                  <span>
                    {user.currentPatientLoad || 0} / {user.maxPatientLoad || 0}
                  </span>
                )}
                {user.role !== 'doctor' && '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
