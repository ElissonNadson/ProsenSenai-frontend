import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles, Save, CheckCircle } from 'lucide-react'
import { useGuest } from '@/contexts/guest-context'
import { useAuth } from '@/contexts/auth-context'
import ImprovedStepIndicator from './components/ImprovedStepIndicator'
import ProjectDetailsStep from './components/steps/ProjectDetailsStep'
import AcademicInfoStep from './components/steps/AcademicInfoStep'
import TeamStep from './components/steps/TeamStep'
import TimelineProgressStep from './components/steps/TimelineProgressStep'
import ReviewStep from './components/steps/ReviewStep'
import DraftRecoveryModal from '@/components/modals/DraftRecoveryModal'

export type ImprovedStep = 'details' | 'academic' | 'team' | 'timeline' | 'review'

interface ProjectFormData {
  // Informações Básicas
  curso: string
  turma: string
  unidadeCurricular: string
  titulo: string
  descricao: string
  categoria: string
  modalidade: string
  
  // Opções
  itinerario: string
  senaiLab: string
  sagaSenai: string
  
  // Equipe
  autores: string[]
  orientador: string
  liderEmail: string
  isLeader: boolean
  
  // Mídia e Anexos
  banner?: File | null
  bannerPreview?: string
  timelineSteps: Array<{
    id: string
    title: string
    description: string
    image?: File | null
    imagePreview?: string
  }>
  codigo?: File | null
  codigoVisibilidade: string
  anexosVisibilidade: string
}

const ImprovedCreateProjectPage = () => {
  const navigate = useNavigate()
  const { isGuest } = useGuest()
  const { isAuthenticated } = useAuth()
  
  const [currentStep, setCurrentStep] = useState<ImprovedStep>('details')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveProgress, setSaveProgress] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDraftModal, setShowDraftModal] = useState(false)
  const [savedDraft, setSavedDraft] = useState<ProjectFormData | null>(null)
  const [draftDate, setDraftDate] = useState<Date | undefined>(undefined)
  
  const [formData, setFormData] = useState<ProjectFormData>({
    curso: '',
    turma: '',
    unidadeCurricular: '',
    titulo: '',
    descricao: '',
    categoria: '',
    modalidade: '',
    itinerario: 'Não',
    senaiLab: 'Não',
    sagaSenai: 'Não',
    autores: [],
    orientador: '',
    liderEmail: '',
    isLeader: false,
    banner: null,
    bannerPreview: undefined,
    timelineSteps: [
      { id: '1', title: 'Ideação', description: '', image: null, imagePreview: undefined },
      { id: '2', title: 'Prototipagem', description: '', image: null, imagePreview: undefined },
      { id: '3', title: 'Desenvolvimento', description: '', image: null, imagePreview: undefined },
      { id: '4', title: 'Finalização', description: '', image: null, imagePreview: undefined },
    ],
    codigo: null,
    codigoVisibilidade: 'Público',
    anexosVisibilidade: 'Público'
  })

  // Redirecionar visitantes
  useEffect(() => {
    if (isGuest || !isAuthenticated) {
      navigate('/app/dashboard', { replace: true })
    }
  }, [isGuest, isAuthenticated, navigate])

  // Auto-save do progresso
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.titulo || formData.descricao) {
        const draftData = {
          formData,
          savedAt: new Date().toISOString()
        }
        localStorage.setItem('project-draft', JSON.stringify(draftData))
        setSaveProgress(true)
        setTimeout(() => setSaveProgress(false), 2000)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [formData])

  // Carregar rascunho salvo
  useEffect(() => {
    const draft = localStorage.getItem('project-draft')
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft)
        const draftFormData = parsedDraft.formData || parsedDraft
        const savedAt = parsedDraft.savedAt ? new Date(parsedDraft.savedAt) : undefined
        
        setSavedDraft(draftFormData)
        setDraftDate(savedAt)
        setShowDraftModal(true)
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error)
      }
    }
  }, [])

  const handleContinueDraft = () => {
    if (savedDraft) {
      setFormData(savedDraft)
    }
    setShowDraftModal(false)
  }

  const handleStartFresh = () => {
    localStorage.removeItem('project-draft')
    setSavedDraft(null)
    setShowDraftModal(false)
  }

  const updateFormData = (updates: Partial<ProjectFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateStep = (step: ImprovedStep): boolean => {
    const newErrors: Record<string, string> = {}

    switch (step) {
      case 'details':
        if (!formData.titulo) newErrors.titulo = 'Título é obrigatório'
        if (!formData.descricao) newErrors.descricao = 'Descrição é obrigatória'
        if (formData.descricao && formData.descricao.length < 50) {
          newErrors.descricao = 'Descrição deve ter pelo menos 50 caracteres'
        }
        if (!formData.banner) {
          newErrors.banner = 'Banner do projeto é obrigatório'
        }
        break
      
      case 'academic':
        if (!formData.curso) newErrors.curso = 'Curso é obrigatório'
        if (!formData.turma) newErrors.turma = 'Turma é obrigatória'
        if (!formData.unidadeCurricular) newErrors.unidadeCurricular = 'UC é obrigatória'
        break
      
      case 'team':
        if (formData.autores.length === 0) {
          newErrors.autores = 'Adicione pelo menos um autor'
        }
        if (!formData.orientador) {
          newErrors.orientador = 'Orientador é obrigatório'
        }
        break
      
      case 'timeline':
        // Timeline é opcional - mas se preenchida deve ter pelo menos 1 anexo por fase
        const phasesWithContent = formData.timelineSteps?.filter(
          (step: any) => step.description && step.description.trim().length > 0
        ) || []
        
        const phasesWithoutAttachments = phasesWithContent.filter(
          (step: any) => !step.attachments || step.attachments.length === 0
        )
        
        if (phasesWithoutAttachments.length > 0) {
          newErrors.timeline = `${phasesWithoutAttachments.length} fase(s) com descrição precisam de pelo menos um anexo (arquivo ou link)`
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return

    const steps: ImprovedStep[] = ['details', 'academic', 'team', 'timeline', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = () => {
    const steps: ImprovedStep[] = ['details', 'academic', 'team', 'timeline', 'review']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleStepClick = (step: ImprovedStep) => {
    const steps: ImprovedStep[] = ['details', 'academic', 'team', 'timeline', 'review']
    const targetIndex = steps.indexOf(step)
    const currentIndex = steps.indexOf(currentStep)
    
    // Permitir voltar para qualquer etapa anterior
    if (targetIndex < currentIndex) {
      setCurrentStep(step)
      return
    }
    
    // Para avançar, validar todas as etapas intermediárias
    for (let i = currentIndex; i < targetIndex; i++) {
      if (!validateStep(steps[i])) {
        return
      }
    }
    
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    if (!validateStep('timeline')) return
    
    setIsSubmitting(true)
    
    try {
      // Aqui faria a chamada para a API
      console.log('Enviando projeto:', formData)
      
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Limpar rascunho salvo
      localStorage.removeItem('project-draft')
      
      // Redirecionar com mensagem de sucesso
      navigate('/app/my-projects', { 
        state: { 
          message: 'Projeto publicado com sucesso!',
          type: 'success'
        }
      })
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      setErrors({ submit: 'Erro ao publicar projeto. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      errors
    }

    switch (currentStep) {
      case 'details':
        return <ProjectDetailsStep {...stepProps} />
      case 'academic':
        return <AcademicInfoStep {...stepProps} />
      case 'team':
        return <TeamStep {...stepProps} />
      case 'timeline':
        return <TimelineProgressStep {...stepProps} />
      case 'review':
        return <ReviewStep {...stepProps} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      default:
        return null
    }
  }

  const steps: ImprovedStep[] = ['details', 'academic', 'team', 'timeline', 'review']
  const currentIndex = steps.indexOf(currentStep)
  const isFirstStep = currentIndex === 0
  const isLastStep = currentIndex === steps.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modal de Recuperação de Rascunho */}
      <DraftRecoveryModal
        isOpen={showDraftModal}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
        draftDate={draftDate}
      />

      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com gradiente */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-primary via-primary-dark to-indigo-700 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
            {/* Decoração de fundo animada */}
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
            <motion.div 
              className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles className="h-6 w-6 text-white" />
                  </motion.div>
                  <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    Novo Projeto
                  </span>
                </div>
                
                {/* Indicador de salvamento automático */}
                <AnimatePresence>
                  {saveProgress && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Rascunho salvo</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                Publique seu Projeto
              </h1>
              <p className="text-white/90 text-lg max-w-3xl leading-relaxed">
                Compartilhe sua criação com a comunidade SENAI. Mostre todo o seu talento e inspire outros estudantes com seu trabalho.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Indicador de Progresso Melhorado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8"
        >
          <ImprovedStepIndicator
            currentStep={currentStep}
            onStepClick={handleStepClick}
          />
        </motion.div>

        {/* Conteúdo das etapas com animação */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderCurrentStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navegação entre etapas - Melhorada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between">
            {/* Botão Voltar */}
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isFirstStep
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 hover:shadow-md'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>

            {/* Indicador de progresso central */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Etapa {currentIndex + 1} de {steps.length}
              </p>
              <div className="w-32 sm:w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Botão Avançar/Publicar */}
            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all hover:shadow-lg disabled:shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Save className="w-5 h-5" />
                    </motion.div>
                    <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Publicar Projeto</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg transition-all group"
              >
                <span>Próximo</span>
                <motion.div
                  className="group-hover:translate-x-1 transition-transform"
                >
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </motion.div>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ImprovedCreateProjectPage
