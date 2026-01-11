import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Stethoscope, MessageSquare, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { Button, Modal, Textarea, Select, Badge, Card, Input, useToast, ConfirmModal } from '@/components/ui';
import { Patient, PatientComment, User, TriageLevel } from '@/types';
import { PRIORITY_LABELS, getPriorityBadgeVariant } from '@/lib/constants';
import { patientApi, userApi } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from '@/lib/date-locale';

interface PatientActionsModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PatientActionsModal: React.FC<PatientActionsModalProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [activeTab, setActiveTab] = useState<'info' | 'comments' | 'actions'>('info');
  const [comments, setComments] = useState<PatientComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [takeCaseComment, setTakeCaseComment] = useState(''); // HUMAN REVIEW: Comentario opcional al tomar caso
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false); // HUMAN REVIEW: Modal para asignar proceso
  const [selectedProcess, setSelectedProcess] = useState<string>('none');
  const [processDetails, setProcessDetails] = useState(''); // HUMAN REVIEW: Detalles del proceso (ej: días de hospitalización, clínica)

  React.useEffect(() => {
    if (isOpen) {
      loadComments();
      loadDoctors();
      // HUMAN REVIEW: Inicializar proceso seleccionado con el proceso actual del paciente cuando se abre el modal
      if (showProcessModal) {
        setSelectedProcess(patient.process || 'none');
        setProcessDetails(patient.processDetails || '');
      }
    }
  }, [isOpen, patient.id]);

  // HUMAN REVIEW: Efecto separado para inicializar proceso cuando se abre el modal de proceso
  React.useEffect(() => {
    if (showProcessModal) {
      setSelectedProcess(patient.process || 'none');
      setProcessDetails(patient.processDetails || '');
    }
  }, [showProcessModal, patient.process, patient.processDetails]);

  const loadComments = async () => {
    const data = await patientApi.getComments(patient.id);
    setComments(data);
  };

  const loadDoctors = async () => {
    const data = await userApi.getDoctors();
    setDoctors(data.filter(d => d.id !== user?.id));
  };

  const handleTakeCase = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // HUMAN REVIEW: Enviar comentario opcional al tomar caso
      await patientApi.assignDoctor(patient.id, user.id, takeCaseComment.trim() || undefined);
      success('Caso asignado exitosamente');
      setTakeCaseComment(''); // Limpiar comentario
      onSuccess();
      onClose();
    } catch (err) {
      error('Error al tomar el caso');
    } finally {
      setIsLoading(false);
    }
  };

  // HUMAN REVIEW: Nueva funcionalidad para actualizar el proceso del paciente
  const handleUpdateProcess = async () => {
    try {
      setIsLoading(true);
      await patientApi.updateProcess(patient.id, selectedProcess, processDetails.trim() || undefined);
      success('Proceso actualizado exitosamente');
      setShowProcessModal(false);
      setSelectedProcess('none');
      setProcessDetails('');
      onSuccess();
    } catch (err) {
      error('Error al actualizar el proceso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    
    try {
      setIsLoading(true);
      await patientApi.addComment({
        patientId: patient.id,
        content: newComment,
        doctorId: user.id
      });
      setNewComment('');
      await loadComments();
      success('Comentario agregado');
    } catch (err) {
      error('Error al agregar comentario');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedDoctorId) return;
    
    try {
      setIsLoading(true);
      await patientApi.reassignDoctor(patient.id, selectedDoctorId);
      success('Caso reasignado exitosamente');
      setShowReassignModal(false);
      onSuccess();
      onClose();
    } catch (err) {
      error('Error al reasignar caso');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDischarge = async () => {
    try {
      setIsLoading(true);
      // HUMAN REVIEW: Usar updateProcess para dar de alta en lugar de solo cambiar status
      await patientApi.updateProcess(patient.id, 'discharge');
      success('Paciente dado de alta');
      setShowDischargeConfirm(false);
      onSuccess();
      onClose();
    } catch (err) {
      error('Error al dar de alta');
    } finally {
      setIsLoading(false);
    }
  };

  const canTakeCase = !patient.doctorId;
  const isMyCase = patient.doctorId === user?.id;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={patient.name}
        description={`Paciente ${patient.identificationNumber}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'info', label: 'Información', icon: Stethoscope },
              { id: 'comments', label: 'Comentarios', icon: MessageSquare, count: comments.length },
              { id: 'actions', label: 'Acciones', icon: UserPlus }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium transition-all
                  ${activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge variant="primary" size="sm">{tab.count}</Badge>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Prioridad">
                    <Badge variant={getPriorityBadgeVariant(patient.priority as TriageLevel)} dot pulse={patient.priority === 1}>
                      P{patient.priority} - {PRIORITY_LABELS[patient.priority as TriageLevel]}
                    </Badge>
                  </InfoItem>
                  
                  <InfoItem label="Estado">
                    <Badge variant={
                      patient.status === 'DISCHARGED' || patient.status === 'COMPLETED' ? 'success' : 
                      patient.status === 'IN_PROGRESS' || patient.status === 'UNDER_TREATMENT' ? 'info' : 
                      patient.status === 'STABILIZED' ? 'warning' : 'neutral'
                    }>
                      {patient.status === 'WAITING' && 'En espera'}
                      {patient.status === 'IN_PROGRESS' && 'En atención'}
                      {patient.status === 'UNDER_TREATMENT' && 'En tratamiento'}
                      {patient.status === 'STABILIZED' && 'Estabilizado'}
                      {patient.status === 'DISCHARGED' && 'Dado de alta'}
                      {patient.status === 'TRANSFERRED' && 'Transferido'}
                      {patient.status === 'COMPLETED' && 'Completado'}
                    </Badge>
                  </InfoItem>

                  <InfoItem label="Edad">{patient.age} años</InfoItem>
                  <InfoItem label="Género">{patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}</InfoItem>
                  
                  <InfoItem label="Doctor Asignado">
                    {patient.doctorName || 'Sin asignar'}
                  </InfoItem>
                  
                  <InfoItem label="Tiempo de Espera">
                    {formatDistanceToNow(new Date(patient.arrivalTime), { locale: es, addSuffix: true })}
                  </InfoItem>

                  {/* HUMAN REVIEW: Mostrar proceso/disposición del paciente si existe */}
                  {patient.process && patient.process !== 'none' && (
                    <>
                      <InfoItem label="Proceso Asignado">
                        <Badge variant={
                          patient.process === 'discharge' ? 'success' :
                          patient.process === 'icu' ? 'danger' :
                          patient.process === 'hospitalization' || patient.process === 'hospitalization_days' ? 'warning' :
                          'info'
                        }>
                          {patient.process === 'discharge' && 'Dar de Alta'}
                          {patient.process === 'hospitalization' && 'Hospitalización'}
                          {patient.process === 'hospitalization_days' && `Hospitalización ${patient.processDetails || ''}`}
                          {patient.process === 'icu' && 'Hospitalización UCI'}
                          {patient.process === 'referral' && 'Remisión a otra clínica'}
                        </Badge>
                      </InfoItem>
                      {patient.processDetails && (
                        <InfoItem label="Detalles del Proceso">
                          {patient.processDetails}
                        </InfoItem>
                      )}
                    </>
                  )}
                </div>

                <Card padding="md" className="bg-gray-50 dark:bg-gray-900/50">
                  <h4 className="font-semibold mb-2">Síntomas:</h4>
                  <p className="text-gray-700 dark:text-gray-300">{patient.symptoms}</p>
                </Card>

                <Card padding="md" className="bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-semibold mb-3">Signos Vitales:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <VitalItem label="Presión Arterial" value={patient.vitalSigns.bloodPressure} />
                    <VitalItem label="Frecuencia Cardíaca" value={`${patient.vitalSigns.heartRate} bpm`} />
                    <VitalItem label="Temperatura" value={`${patient.vitalSigns.temperature}°C`} />
                    <VitalItem label="Freq. Respiratoria" value={`${patient.vitalSigns.respiratoryRate} rpm`} />
                    <VitalItem label="Sat. Oxígeno" value={`${patient.vitalSigns.oxygenSaturation}%`} />
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'comments' && (
              <motion.div
                key="comments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Comment Timeline */}
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                  {comments.length === 0 ? (
                    <Card padding="lg" className="text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">No hay comentarios aún</p>
                    </Card>
                  ) : (
                    comments.map((comment, index) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card padding="md" className="relative pl-12">
                          <div className="absolute left-4 top-4 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                            {comment.doctorName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {comment.doctorName}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(comment.createdAt), { locale: es, addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                {isMyCase && (
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Textarea
                      placeholder="Agregar comentario médico..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      variant="primary"
                      onClick={handleAddComment}
                      isLoading={isLoading}
                      disabled={!newComment.trim()}
                      fullWidth
                    >
                      Agregar Comentario
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'actions' && (
              <motion.div
                key="actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {canTakeCase && (
                  <Card hoverable padding="lg" className="border-2 border-blue-500/20">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                        <Stethoscope className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-semibold text-lg mb-1">Tomar Caso</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            Asignarse este paciente para iniciar su atención médica
                          </p>
                        </div>
                        {/* HUMAN REVIEW: Comentario opcional al tomar caso */}
                        <Textarea
                          placeholder="Agregar comentario inicial (opcional)..."
                          value={takeCaseComment}
                          onChange={(e) => setTakeCaseComment(e.target.value)}
                          rows={2}
                          className="mb-2"
                        />
                        <Button variant="primary" onClick={handleTakeCase} isLoading={isLoading} fullWidth>
                          Tomar Caso
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {isMyCase && (
                  <>
                    <Card hoverable padding="lg" className="border-2 border-amber-500/20">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                          <UserPlus className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Reasignar Caso</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            Transferir este caso a otro médico especializado
                          </p>
                          <Button variant="secondary" onClick={() => setShowReassignModal(true)}>
                            Reasignar
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* HUMAN REVIEW: Nueva funcionalidad para asignar proceso al paciente */}
                    <Card hoverable padding="lg" className="border-2 border-purple-500/20">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                          <CheckCircle className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Asignar Proceso</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            Definir el proceso o disposición del paciente (alta, hospitalización, remisión, UCI)
                          </p>
                          {patient.process && patient.process !== 'none' ? (
                            <div className="mb-3">
                              <Badge variant={
                                patient.process === 'discharge' ? 'success' :
                                patient.process === 'icu' ? 'danger' :
                                'warning'
                              }>
                                {patient.process === 'discharge' && 'Dar de Alta'}
                                {patient.process === 'hospitalization' && 'Hospitalización'}
                                {patient.process === 'hospitalization_days' && `Hospitalización ${patient.processDetails || ''}`}
                                {patient.process === 'icu' && 'Hospitalización UCI'}
                                {patient.process === 'referral' && 'Remisión a otra clínica'}
                              </Badge>
                              {patient.processDetails && (
                                <p className="text-sm text-gray-500 mt-1">{patient.processDetails}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 mb-3">Sin proceso asignado</p>
                          )}
                          <Button variant="secondary" onClick={() => setShowProcessModal(true)}>
                            {patient.process && patient.process !== 'none' ? 'Cambiar Proceso' : 'Asignar Proceso'}
                          </Button>
                        </div>
                      </div>
                    </Card>

                    <Card hoverable padding="lg" className="border-2 border-emerald-500/20">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">Dar de Alta</h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-3">
                            Completar la atención y cerrar el caso del paciente
                          </p>
                          <Button variant="success" onClick={() => setShowDischargeConfirm(true)}>
                            Dar de Alta
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </>
                )}

                {!canTakeCase && !isMyCase && (
                  <Card padding="lg" className="text-center bg-gray-50 dark:bg-gray-900/50">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Este caso ya está siendo atendido por {patient.doctorName}
                    </p>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Modal>

      {/* Reassign Modal */}
      <Modal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        title="Reasignar Caso"
        description="Seleccione el médico al que desea transferir este caso"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowReassignModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleReassign}
              isLoading={isLoading}
              disabled={!selectedDoctorId}
            >
              Reasignar
            </Button>
          </>
        }
      >
        <Select
          label="Médico"
          value={selectedDoctorId}
          onChange={(e) => setSelectedDoctorId(e.target.value)}
          options={[
            { value: '', label: 'Seleccione un médico...' },
            ...doctors.map(d => ({ value: d.id, label: `${d.name} - ${d.specialization || d.department}` }))
          ]}
        />
      </Modal>

      {/* Discharge Confirmation */}
      <ConfirmModal
        isOpen={showDischargeConfirm}
        onClose={() => setShowDischargeConfirm(false)}
        onConfirm={handleDischarge}
        title="Confirmar Alta del Paciente"
        message={`¿Está seguro de dar de alta a ${patient.name}? Esta acción cerrará el caso y el paciente será movido al historial.`}
        confirmText="Dar de Alta"
        variant="info"
        isLoading={isLoading}
      />

      {/* HUMAN REVIEW: Modal para asignar proceso al paciente */}
      <Modal
        isOpen={showProcessModal}
        onClose={() => {
          setShowProcessModal(false);
          // HUMAN REVIEW: Resetear a los valores actuales del paciente
          setSelectedProcess(patient.process || 'none');
          setProcessDetails(patient.processDetails || '');
        }}
        title="Asignar Proceso al Paciente"
        description={`Seleccione el proceso o disposición para ${patient.name}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proceso / Disposición
            </label>
            <Select
              value={selectedProcess}
              onChange={(e) => {
                setSelectedProcess(e.target.value);
                // Limpiar detalles si se cambia a un proceso que no requiere detalles
                if (e.target.value !== 'hospitalization_days' && e.target.value !== 'referral') {
                  setProcessDetails('');
                } else if (e.target.value === 'hospitalization_days' && !processDetails) {
                  setProcessDetails('');
                } else if (e.target.value === 'referral' && !processDetails) {
                  setProcessDetails('');
                }
              }}
              options={[
                { value: 'none', label: 'Sin proceso asignado' },
                { value: 'discharge', label: 'Dar de Alta' },
                { value: 'hospitalization', label: 'Hospitalización General' },
                { value: 'hospitalization_days', label: 'Hospitalización X Días' },
                { value: 'icu', label: 'Hospitalización UCI' },
                { value: 'referral', label: 'Remitir a otra Clínica' }
              ]}
            />
          </div>

          {/* HUMAN REVIEW: Mostrar campo de detalles según el proceso seleccionado */}
          {(selectedProcess === 'hospitalization_days' || selectedProcess === 'referral') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedProcess === 'hospitalization_days' ? 'Número de Días (ej: 5 días)' : 'Nombre de la Clínica (ej: Clínica San José)'}
              </label>
              <Input
                type={selectedProcess === 'hospitalization_days' ? 'text' : 'text'}
                placeholder={selectedProcess === 'hospitalization_days' ? 'Ej: 5 días' : 'Ej: Clínica San José'}
                value={processDetails}
                onChange={(e) => setProcessDetails(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowProcessModal(false);
                setSelectedProcess(patient.process || 'none');
                setProcessDetails(patient.processDetails || '');
              }}
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={handleUpdateProcess}
              isLoading={isLoading}
              disabled={selectedProcess === 'none' || (selectedProcess === 'hospitalization_days' && !processDetails.trim()) || (selectedProcess === 'referral' && !processDetails.trim())}
              fullWidth
            >
              {selectedProcess === 'none' ? 'Limpiar Proceso' : 'Asignar Proceso'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const InfoItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
    <div className="font-medium text-gray-900 dark:text-white">{children}</div>
  </div>
);

const VitalItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</p>
    <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
  </div>
);
