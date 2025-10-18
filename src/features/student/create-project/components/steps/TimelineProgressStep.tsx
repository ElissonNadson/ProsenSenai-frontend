import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  CheckCircle, 
  Circle,
  Lightbulb,
  Settings,
  Code,
  Rocket,
  AlertCircle,
  Info,
  Loader2,
  Paperclip,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useEtapasProjeto } from '../../../../../hooks/use-etapas-projeto'
import type { CreateEtapaProjetoMutation } from '../../../../../types/types-mutations'
import StageAttachmentsManager from './StageAttachmentsManager'

interface TimelineProgressStepProps {
  formData: any
  updateFormData: (updates: any) => void
  errors: Record<string, string>
}

interface StageAttachment {
  id: string
  optionId: string
  type: 'file' | 'link'
  file?: File
  link?: string
  name: string
}

interface ProjectPhase {
  id: string
  uuid?: string
  title: string
  icon: any
  placeholder: string
  explanation: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  currentStep: number  // Etapa atual (ex: 4)
  totalSteps: number   // Total de etapas (ex: 9)
  ordem: number
  isSaved?: boolean
  attachments?: StageAttachment[]
  isExpanded?: boolean
}

// 4 Fases fixas do projeto
const PROJECT_PHASES = [
  { 
    id: 'ideacao',
    title: 'Ideação', 
    icon: Lightbulb, 
    placeholder: 'Descreva como surgiu a ideia, brainstorming realizado, problema identificado e planejamento inicial...',
    explanation: 'Fase inicial onde você identifica o problema, gera ideias através de técnicas criativas como Crazy 8, Mapa Mental e define a proposta de valor do projeto.',
    ordem: 1
  },
  { 
    id: 'modelagem',
    title: 'Modelagem', 
    icon: Settings, 
    placeholder: 'Explique a modelagem do negócio, análise de viabilidade, definição de requisitos e arquitetura do projeto...',
    explanation: 'Fase de planejamento detalhado onde você estrutura o modelo de negócio, analisa viabilidade, riscos e define cronograma de execução.',
    ordem: 2
  },
  { 
    id: 'prototipagem',
    title: 'Prototipagem', 
    icon: Code, 
    placeholder: 'Conte sobre os protótipos criados, wireframes, mockups, testes de usabilidade e feedback recebido...',
    explanation: 'Fase de criação de protótipos para validar ideias. Desenvolva wireframes, mockups, protótipos interativos ou maquetes físicas para testar conceitos.',
    ordem: 3
  },
  { 
    id: 'implementacao',
    title: 'Implementação', 
    icon: Rocket, 
    placeholder: 'Descreva a implementação final, tecnologias utilizadas, desenvolvimento, testes e resultados obtidos...',
    explanation: 'Fase final onde o projeto é desenvolvido e testado. Registre testes, feedbacks de usuários e apresente os resultados através de vídeo pitch.',
    ordem: 4
  }
]

// Mapeia status do componente para status do backend
const mapStatusToBackend = (status: 'pending' | 'in-progress' | 'completed'): string => {
  switch (status) {
    case 'pending': return 'PENDENTE'
    case 'in-progress': return 'EM_ANDAMENTO'
    case 'completed': return 'CONCLUIDA'
    default: return 'PENDENTE'
  }
}

// Mapeia status do backend para status do componente
const mapStatusFromBackend = (status: string): 'pending' | 'in-progress' | 'completed' => {
  switch (status) {
    case 'PENDENTE': return 'pending'
    case 'EM_ANDAMENTO': return 'in-progress'
    case 'CONCLUIDA': return 'completed'
    default: return 'pending'
  }
}

const TimelineProgressStep: React.FC<TimelineProgressStepProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  // Inicializa phases garantindo que sempre tenha os ícones das 4 fases fixas
  const initializePhases = (): ProjectPhase[] => {
    if (formData.timelineSteps && formData.timelineSteps.length > 0) {
      // Garante que sempre teremos exatamente 4 fases, mesmo se vieram dados antigos
      const result: ProjectPhase[] = []
      
      PROJECT_PHASES.forEach((defaultPhase, index) => {
        const savedPhase = formData.timelineSteps[index]
        
        if (savedPhase) {
          // Mescla dados salvos com a definição fixa da fase
          result.push({
            ...defaultPhase,
            description: savedPhase.description || '',
            status: savedPhase.status || 'pending',
            currentStep: savedPhase.currentStep || 1,
            totalSteps: savedPhase.totalSteps || 10,
            uuid: savedPhase.uuid,
            isSaved: savedPhase.isSaved || false,
            attachments: savedPhase.attachments || [],
            isExpanded: savedPhase.isExpanded !== undefined ? savedPhase.isExpanded : true // Auto-expand by default
          })
        } else {
          // Cria fase nova se não existir - expandida por padrão
          result.push({
            ...defaultPhase,
            description: '',
            status: 'pending' as const,
            currentStep: 1,
            totalSteps: 10,
            isSaved: false,
            attachments: [],
            isExpanded: true // Auto-expand by default
          })
        }
      })
      
      return result
    }
    
    // Se não há etapas salvas, cria as 4 fases fixas - todas expandidas
    return PROJECT_PHASES.map((phase) => ({
      ...phase,
      description: '',
      status: 'pending' as const,
      currentStep: 1,
      totalSteps: 10,
      isSaved: false,
      attachments: [],
      isExpanded: true // Auto-expand by default
    }))
  }

  const [phases, setPhases] = useState<ProjectPhase[]>(initializePhases())
  const [savingPhases, setSavingPhases] = useState<Set<string>>(new Set())
  const [attachmentErrors, setAttachmentErrors] = useState<Record<number, string>>({})
  
  const { 
    createEtapa, 
    updateEtapa, 
    updateEtapaStatus,
    loading: apiLoading,
    error: apiError 
  } = useEtapasProjeto()

  // Atualiza formData sempre que phases mudar
  useEffect(() => {
    updateFormData({ timelineSteps: phases })
  }, [phases])

  // Validation function
  const validateAttachments = (): boolean => {
    const errors: Record<number, string> = {}
    let isValid = true

    phases.forEach((phase, index) => {
      const hasContent = phase.description.trim().length > 0
      
      if (hasContent && (!phase.attachments || phase.attachments.length === 0)) {
        errors[index] = 'Adicione pelo menos um arquivo ou link para esta fase'
        isValid = false
      }
    })

    setAttachmentErrors(errors)
    return isValid
  }

  // Expose validation function
  useEffect(() => {
    updateFormData({ 
      timelineSteps: phases,
      validateTimelineAttachments: validateAttachments
    })
  }, [phases])

  const handlePhaseChange = (index: number, field: string, value: any) => {
    const updated = [...phases]
    updated[index] = { ...updated[index], [field]: value, isSaved: false }
    setPhases(updated)
  }

  const toggleExpanded = (index: number) => {
    const updated = [...phases]
    updated[index] = { ...updated[index], isExpanded: !updated[index].isExpanded }
    setPhases(updated)
  }

  const toggleStatus = async (index: number) => {
    const phase = phases[index]
    const current = phase.status
    const nextStatus = current === 'pending' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'pending'
    
    if (phase.uuid && phase.isSaved && formData.projetoUuid) {
      try {
        setSavingPhases(prev => new Set(prev).add(phase.id))
        await updateEtapaStatus(phase.uuid, mapStatusToBackend(nextStatus))
      } catch (error) {
        console.error('Erro ao atualizar status no backend:', error)
      } finally {
        setSavingPhases(prev => {
          const newSet = new Set(prev)
          newSet.delete(phase.id)
          return newSet
        })
      }
    }
    
    handlePhaseChange(index, 'status', nextStatus)
  }

  const updateStepProgress = (index: number, currentStep: number, totalSteps: number) => {
    const updated = [...phases]
    updated[index] = { ...updated[index], currentStep, totalSteps }
    setPhases(updated)
  }

  // Função para salvar uma fase no backend
  const savePhaseToBackend = async (phase: ProjectPhase, projetoUuid: string) => {
    if (!phase.description) return
    
    const etapaData: CreateEtapaProjetoMutation = {
      projeto: { uuid: projetoUuid },
      nomeEtapa: phase.title,
      descricao: phase.description,
      ordem: phase.ordem,
      status: mapStatusToBackend(phase.status),
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    }

    try {
      setSavingPhases(prev => new Set(prev).add(phase.id))
      
      if (phase.uuid && phase.isSaved) {
        const updated = await updateEtapa(phase.uuid, etapaData)
        return { ...phase, uuid: updated.uuid, isSaved: true }
      } else {
        const created = await createEtapa(etapaData)
        return { ...phase, uuid: created.uuid, isSaved: true }
      }
    } catch (error) {
      console.error('Erro ao salvar fase:', error)
      throw error
    } finally {
      setSavingPhases(prev => {
        const newSet = new Set(prev)
        newSet.delete(phase.id)
        return newSet
      })
    }
  }

  // Auto-save quando tem UUID do projeto
  useEffect(() => {
    if (formData.projetoUuid) {
      const saveAllPhases = async () => {
        const updatedPhases = [...phases]
        for (let i = 0; i < updatedPhases.length; i++) {
          const phase = updatedPhases[i]
          if (phase.description && !phase.isSaved) {
            try {
              const saved = await savePhaseToBackend(phase, formData.projetoUuid)
              if (saved) {
                updatedPhases[i] = saved
              }
            } catch (error) {
              console.error(`Erro ao salvar fase ${i + 1}:`, error)
            }
          }
        }
        setPhases(updatedPhases)
      }
      
      const hasUnsaved = phases.some(p => !p.isSaved && p.description)
      if (hasUnsaved) {
        saveAllPhases()
      }
    }
  }, [formData.projetoUuid])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'from-green-500 to-emerald-600'
      case 'in-progress': return 'from-yellow-500 to-orange-600'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5" strokeWidth={3} />
      case 'in-progress': return <TrendingUp className="w-5 h-5" />
      default: return <Circle className="w-5 h-5" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída'
      case 'in-progress': return 'Em Andamento'
      default: return 'Não Iniciada'
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header Principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-3xl p-8 md:p-12 shadow-lg border-2 border-indigo-200 dark:border-indigo-800"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-4 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <TrendingUp className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Progresso do Projeto 📊
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Documente as 4 fases do desenvolvimento - atualize conforme avança!
              </p>
            </div>
          </div>
        </div>

        {/* Informação sobre atualização */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-6"
        >
          <div className="flex gap-4">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-base font-bold text-blue-900 dark:text-blue-100 mb-2">
                💡 Como funciona o Progresso
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2 leading-relaxed">
                <li>• <strong>4 Fases Fixas:</strong> Ideação → Modelagem → Prototipagem → Implementação</li>
                <li>• <strong>Cada fase explica o que deve ser feito:</strong> Expanda a fase para ver a descrição completa</li>
                <li>• <strong>Etapas dentro das fases:</strong> Registre seu progresso (ex: Etapa 4 de 9)</li>
                <li>• <strong>⚠️ IMPORTANTE - Anexe evidências:</strong> Se você preencher a descrição de uma fase, deve adicionar pelo menos 1 arquivo ou link</li>
                <li>• <strong>Arrastar e Soltar:</strong> Arraste arquivos diretamente nas opções ou clique para selecionar</li>
                <li>• <strong>Atualize quando quiser:</strong> Volte aqui para registrar novos avanços</li>
                <li>• <strong>Marque o status:</strong> Clique no badge colorido para atualizar (Não Iniciada → Em Andamento → Concluída)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Fases do Projeto */}
      <div className="space-y-4">
        <AnimatePresence>
          {phases.map((phase, index) => {
            const PhaseIcon = phase.icon
            const isExpanded = phase.isExpanded

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Header da Fase */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-750">
                  <div className="flex items-center gap-4">
                    {/* Ícone da Fase */}
                    <div className={`p-3 bg-gradient-to-br ${getStatusColor(phase.status)} rounded-xl shadow-lg text-white`}>
                      <PhaseIcon className="w-6 h-6" />
                    </div>

                    {/* Título e Progresso */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {phase.title}
                        </h3>
                        {phase.attachments && phase.attachments.length > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-medium">
                            <Paperclip className="w-3 h-3" />
                            {phase.attachments.length}
                          </span>
                        )}
                      </div>
                      
                      {/* Progresso de Etapas - Redesenhado */}
                      <div className="space-y-2">
                        {/* Barra de Progresso com Label Integrado */}
                        <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <motion.div
                            className={`h-full bg-gradient-to-r ${getStatusColor(phase.status)} rounded-lg flex items-center justify-between px-3`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(phase.currentStep / phase.totalSteps) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          >
                            <span className="text-white text-xs font-bold">
                              Etapa {phase.currentStep}
                            </span>
                          </motion.div>
                          
                          {/* Label no final da barra */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {Math.round((phase.currentStep / phase.totalSteps) * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Controles de Etapa */}
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span>Etapa atual:</span>
                          <input
                            type="number"
                            min="1"
                            max={phase.totalSteps}
                            value={phase.currentStep}
                            onChange={e => updateStepProgress(index, parseInt(e.target.value) || 1, phase.totalSteps)}
                            className="w-14 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-center text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min={phase.currentStep}
                            max="99"
                            value={phase.totalSteps}
                            onChange={e => updateStepProgress(index, phase.currentStep, parseInt(e.target.value) || 10)}
                            className="w-14 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-center text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <span>etapas totais</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <motion.button
                      onClick={() => toggleStatus(index)}
                      disabled={savingPhases.has(phase.id)}
                      whileHover={{ scale: savingPhases.has(phase.id) ? 1 : 1.05 }}
                      whileTap={{ scale: savingPhases.has(phase.id) ? 1 : 0.95 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(phase.status)} text-white font-medium shadow-lg transition-all hover:shadow-xl ${savingPhases.has(phase.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {savingPhases.has(phase.id) ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        getStatusIcon(phase.status)
                      )}
                      <span className="text-sm hidden sm:inline">{getStatusLabel(phase.status)}</span>
                    </motion.button>

                    {/* Indicador de Salvamento */}
                    {phase.isSaved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium"
                        title="Salvo no servidor"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </motion.div>
                    )}

                    {/* Botão Expandir/Recolher */}
                    <motion.button
                      onClick={() => toggleExpanded(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>

                {/* Conteúdo da Fase (Expandido) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 space-y-6">
                        {/* Phase Explanation */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
                          <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">
                                O que é esta fase?
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                {phase.explanation}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Descrição da Fase
                          </label>
                          <textarea
                            value={phase.description}
                            onChange={e => handlePhaseChange(index, 'description', e.target.value)}
                            placeholder={phase.placeholder}
                            rows={5}
                            className="w-full bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-base text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                          />
                          {phase.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              {phase.description.length} caracteres
                            </p>
                          )}
                        </div>

                        {/* Attachments Section */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                          <StageAttachmentsManager
                            stageType={phase.title as 'Ideação' | 'Modelagem' | 'Prototipagem' | 'Implementação'}
                            attachments={phase.attachments || []}
                            onChange={(attachments) => {
                              handlePhaseChange(index, 'attachments', attachments)
                              if (attachments.length > 0 && attachmentErrors[index]) {
                                setAttachmentErrors(prev => {
                                  const newErrors = { ...prev }
                                  delete newErrors[index]
                                  return newErrors
                                })
                              }
                            }}
                            error={attachmentErrors[index]}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Mensagem de Erro da API */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6"
        >
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-base font-bold text-red-900 dark:text-red-100 mb-2">
                ⚠️ Erro ao salvar fase
              </p>
              <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">
                {apiError}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {errors.timeline && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2 font-medium bg-red-50 dark:bg-red-900/20 p-4 rounded-xl"
        >
          <AlertCircle className="w-5 h-5" />
          {errors.timeline}
        </motion.p>
      )}

    </div>
  )
}

export default TimelineProgressStep
