import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Briefcase, Edit, Trash2 } from 'lucide-react';
import { Badge, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '@/components/ui';
import { User, UserRole } from '@/types';

interface UsersTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

const ROLE_BADGES: Record<UserRole, { variant: 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral'; label: string }> = {
  [UserRole.ADMIN]: { variant: 'danger', label: 'Administrador' },
  [UserRole.DOCTOR]: { variant: 'primary', label: 'Médico' },
  [UserRole.NURSE]: { variant: 'success', label: 'Enfermero/a' }
};

// Mapeo de áreas de enfermería del backend a español
const AREA_LABELS: Record<string, string> = {
  'triage': 'Triage',
  'emergency': 'Urgencias/Emergencias',
  'icu': 'UCI (Cuidados Intensivos)',
  'general_ward': 'Sala General',
  'pediatrics': 'Pediatría',
  'surgery': 'Cirugía',
  'other': 'Otro'
};

// Mapeo de especialidades médicas del backend a español
const SPECIALTY_LABELS: Record<string, string> = {
  'general_medicine': 'Medicina General',
  'emergency_medicine': 'Medicina de Emergencia',
  'cardiology': 'Cardiología',
  'neurology': 'Neurología',
  'pediatrics': 'Pediatría',
  'surgery': 'Cirugía',
  'internal_medicine': 'Medicina Interna',
  'traumatology': 'Traumatología',
  'intensive_care': 'Cuidados Intensivos',
  'other': 'Otro'
};

export const UsersTable: React.FC<UsersTableProps> = ({ users, onEdit, onDelete }) => {
  const getDepartmentLabel = (user: User): string => {
    // Priorizar campos en este orden
    if (user.area) return AREA_LABELS[user.area] || user.area;
    if (user.specialty) return SPECIALTY_LABELS[user.specialty] || user.specialty;
    if (user.department) return user.department;
    if (user.specialization) return user.specialization;
    return '';
  };
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Departamento/Especialización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">No hay usuarios registrados</p>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, index) => {
                // HUMAN REVIEW: Mapear rol del backend (string) a enum UserRole
                let normalizedRole: UserRole;
                if (typeof user.role === 'string') {
                  const roleLower = user.role.toLowerCase();
                  if (roleLower === 'admin') normalizedRole = UserRole.ADMIN;
                  else if (roleLower === 'doctor') normalizedRole = UserRole.DOCTOR;
                  else if (roleLower === 'nurse') normalizedRole = UserRole.NURSE;
                  else normalizedRole = UserRole.ADMIN; // fallback
                } else {
                  normalizedRole = user.role;
                }
                const roleBadge = ROLE_BADGES[normalizedRole] || { variant: 'neutral' as const, label: user.role?.toString() || 'Desconocido' };
                
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.phone ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {getDepartmentLabel(user) ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Briefcase className="w-4 h-4" />
                          {getDepartmentLabel(user)}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit?.(user)}
                          leftIcon={<Edit className="w-4 h-4" />}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete?.(user)}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
