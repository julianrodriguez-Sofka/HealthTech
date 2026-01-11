import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { Input, Select, Button, Badge, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui';
import { Patient, TriageLevel } from '@/types';
import { PRIORITY_LABELS, getPriorityBadgeVariant } from '@/lib/constants';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from '@/lib/date-locale';

interface PatientsHistoryTableProps {
  patients: Patient[];
  onViewDetails?: (patient: Patient) => void;
}

export const PatientsHistoryTable: React.FC<PatientsHistoryTableProps> = ({ patients, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.identificationNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = filterPriority === 'all' || patient.priority === Number(filterPriority);
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

  const handleExport = () => {
    const csv = [
      ['Nombre', 'ID', 'Edad', 'Prioridad', 'Estado', 'Doctor', 'Fecha Llegada'].join(','),
      ...filteredPatients.map(p =>
        [
          p.name,
          p.identificationNumber,
          p.age,
          `P${p.priority}`,
          p.status,
          p.doctorName || 'N/A',
          format(new Date(p.arrivalTime), 'dd/MM/yyyy HH:mm')
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pacientes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>

          <Select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            options={[
              { value: 'all', label: 'Todas las prioridades' },
              { value: '1', label: 'P1 - Crítico' },
              { value: '2', label: 'P2 - Alto' },
              { value: '3', label: 'P3 - Moderado' },
              { value: '4', label: 'P4 - Bajo' },
              { value: '5', label: 'P5 - No urgente' }
            ]}
          />

          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={[
              { value: 'all', label: 'Todos los estados' },
              { value: 'WAITING', label: 'En espera' },
              { value: 'IN_PROGRESS', label: 'En atención' },
              { value: 'COMPLETED', label: 'Completado' }
            ]}
          />
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {paginatedPatients.length} de {filteredPatients.length} pacientes
          </p>
          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
            Exportar CSV
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Edad</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Fecha Llegada</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron pacientes</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient, index) => (
                  <motion.tr
                    key={patient.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <TableCell>
                      <div className="font-medium text-gray-900 dark:text-white">{patient.name}</div>
                      <div className="text-sm text-gray-500">{patient.gender}</div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm">{patient.identificationNumber}</code>
                    </TableCell>
                    <TableCell>{patient.age} años</TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(patient.priority as TriageLevel)} dot>
                        P{patient.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          patient.status === 'COMPLETED'
                            ? 'success'
                            : patient.status === 'IN_PROGRESS'
                            ? 'info'
                            : 'neutral'
                        }
                      >
                        {patient.status === 'WAITING' && 'En espera'}
                        {patient.status === 'IN_PROGRESS' && 'En atención'}
                        {patient.status === 'COMPLETED' && 'Completado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{patient.doctorName || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {format(new Date(patient.arrivalTime), 'dd/MM/yy HH:mm')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(patient.arrivalTime), { locale: es, addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails?.(patient)}
                        leftIcon={<Eye className="w-4 h-4" />}
                      >
                        Ver
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
