import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  Link as LinkIcon,
  X,
  FileText,
  Image,
  Video,
  File,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface AttachmentOption {
  id: string
  label: string
  type: 'file' | 'link'
  acceptedFormats?: string
  icon: React.ElementType
}

interface StageAttachment {
  id: string
  optionId: string
  type: 'file' | 'link'
  file?: File
  link?: string
  name: string
}

interface StageAttachmentsManagerProps {
  stageType: 'Ideação' | 'Modelagem' | 'Prototipagem' | 'Implementação'
  attachments: StageAttachment[]
  onChange: (attachments: StageAttachment[]) => void
  error?: string
}

// Define options for each stage
const stageOptions: Record<string, AttachmentOption[]> = {
  'Ideação': [
    { id: 'crazy8', label: 'Crazy 8', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: FileText },
    { id: 'mapa_mental', label: 'Mapa Mental ou Nuvem de Palavras', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: Image },
    { id: 'value_proposition', label: 'Proposta de Valor (Value Proposition Canvas)', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: FileText },
    { id: 'customer_journey', label: 'Jornada do Usuário (Customer Journey Map)', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: FileText },
    { id: 'scamper', label: 'Técnica SCAMPER', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png,.docx', icon: FileText },
    { id: 'mapa_empatia', label: 'Mapa de Empatia', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: Image },
    { id: 'video_pitch', label: 'Vídeo Pitch', type: 'link', icon: Video },
    { id: 'persona', label: 'Persona', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: FileText }
  ],
  'Modelagem': [
    { id: 'business_canvas', label: 'Business Model Canvas', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: FileText },
    { id: 'viabilidade', label: 'Planilha de Viabilidade do Projeto', type: 'file', acceptedFormats: '.pdf,.xlsx,.xls', icon: FileText },
    { id: 'swot', label: 'Análise SWOT', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png,.docx', icon: FileText },
    { id: 'matriz_riscos', label: 'Matriz de Riscos', type: 'file', acceptedFormats: '.pdf,.xlsx,.xls,.jpg,.jpeg,.png', icon: FileText },
    { id: 'cronograma', label: 'Cronograma de Execução (Gantt, 5W2H, etc.)', type: 'file', acceptedFormats: '.pdf,.xlsx,.xls,.jpg,.jpeg,.png', icon: FileText }
  ],
  'Prototipagem': [
    { id: 'wireframes', label: 'Wireframes', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png,.fig', icon: Image },
    { id: 'mockups', label: 'Mockups', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png,.fig', icon: Image },
    { id: 'prototipo_interativo', label: 'Protótipo Interativo (Figma, Adobe XD, InVision, etc.)', type: 'link', icon: LinkIcon },
    { id: 'modelagem_3d', label: 'Desenho 3D / Modelagem CAD', type: 'file', acceptedFormats: '.pdf,.stl,.obj,.jpg,.jpeg,.png', icon: File },
    { id: 'maquete_fisica', label: 'Fotos ou Vídeo de Maquete Física', type: 'file', acceptedFormats: '.jpg,.jpeg,.png,.mp4,.mov', icon: Image },
    { id: 'fluxograma', label: 'Fluxograma de Processo', type: 'file', acceptedFormats: '.pdf,.jpg,.jpeg,.png', icon: FileText }
  ],
  'Implementação': [
    { id: 'video_pitch_impl', label: 'Vídeo Pitch', type: 'link', icon: Video },
    { id: 'teste_piloto', label: 'Teste Piloto', type: 'file', acceptedFormats: '.pdf,.docx,.jpg,.jpeg,.png', icon: FileText },
    { id: 'registro_testes', label: 'Registro de Testes ou Logs de Uso', type: 'file', acceptedFormats: '.pdf,.txt,.xlsx,.xls', icon: FileText },
    { id: 'feedback_cliente', label: 'Formulário de Feedback do Cliente', type: 'file', acceptedFormats: '.pdf,.xlsx,.xls,.jpg,.jpeg,.png', icon: FileText },
    { id: 'entrevista_usuarios', label: 'Entrevista com Usuários', type: 'file', acceptedFormats: '.pdf,.docx,.mp3,.mp4', icon: FileText },
    { id: 'video_usuarios', label: 'Vídeo de Usuários Utilizando o Produto', type: 'link', icon: Video },
    { id: 'relato_experiencia', label: 'Vídeo do Relato de Experiência do Cliente', type: 'link', icon: Video }
  ]
}

const StageAttachmentsManager: React.FC<StageAttachmentsManagerProps> = ({
  stageType,
  attachments,
  onChange,
  error
}) => {
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [showLinkInput, setShowLinkInput] = useState<string | null>(null)
  const [linkValue, setLinkValue] = useState('')

  const options = stageOptions[stageType] || []

  const handleFileSelect = (optionId: string, file: File, option: AttachmentOption) => {
    const newAttachment: StageAttachment = {
      id: `${optionId}-${Date.now()}`,
      optionId,
      type: 'file',
      file,
      name: file.name
    }
    onChange([...attachments, newAttachment])
  }

  const handleLinkAdd = (optionId: string, option: AttachmentOption) => {
    if (!linkValue.trim()) return

    const newAttachment: StageAttachment = {
      id: `${optionId}-${Date.now()}`,
      optionId,
      type: 'link',
      link: linkValue,
      name: option.label
    }
    onChange([...attachments, newAttachment])
    setLinkValue('')
    setShowLinkInput(null)
  }

  const handleRemoveAttachment = (id: string) => {
    onChange(attachments.filter(att => att.id !== id))
  }

  const handleDrop = (e: React.DragEvent, optionId: string, option: AttachmentOption) => {
    e.preventDefault()
    setDragOver(null)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(optionId, files[0], option)
    }
  }

  const getAttachmentIcon = (option: AttachmentOption) => {
    const Icon = option.icon
    return <Icon className="w-5 h-5" />
  }

  const hasAttachmentForOption = (optionId: string) => {
    return attachments.some(att => att.optionId === optionId)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            📎 Anexos da Etapa
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Arraste arquivos</strong> diretamente nas opções abaixo ou <strong>clique nos botões</strong> para selecionar
          </p>
        </div>
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {attachments.length} {attachments.length === 1 ? 'item' : 'itens'}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map((option) => {
          const hasAttachment = hasAttachmentForOption(option.id)
          const isShowingLinkInput = showLinkInput === option.id

          return (
            <div
              key={option.id}
              className={`border-2 rounded-lg p-4 transition-all ${
                hasAttachment
                  ? 'border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/10'
                  : dragOver === option.id
                  ? 'border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 scale-105 shadow-lg'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onDragOver={(e) => {
                if (option.type === 'file') {
                  e.preventDefault()
                  setDragOver(option.id)
                }
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => option.type === 'file' && handleDrop(e, option.id, option)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-lg ${
                  hasAttachment
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {getAttachmentIcon(option)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                    {option.label}
                  </h5>

                  {/* File Input or Link Input */}
                  {option.type === 'file' ? (
                    <label className="block">
                      <input
                        type="file"
                        accept={option.acceptedFormats}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileSelect(option.id, file, option)
                        }}
                        className="hidden"
                      />
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        {dragOver === option.id ? 'Solte aqui!' : 'Escolher ou Arrastar'}
                      </span>
                    </label>
                  ) : (
                    <div>
                      {!isShowingLinkInput ? (
                        <button
                          onClick={() => setShowLinkInput(option.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          Adicionar link
                        </button>
                      ) : (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="url"
                            value={linkValue}
                            onChange={(e) => setLinkValue(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            autoFocus
                          />
                          <button
                            onClick={() => handleLinkAdd(option.id, option)}
                            className="px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                          >
                            OK
                          </button>
                          <button
                            onClick={() => {
                              setShowLinkInput(null)
                              setLinkValue('')
                            }}
                            className="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Accepted formats hint */}
                  {option.type === 'file' && option.acceptedFormats && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Formatos: {option.acceptedFormats.replace(/\./g, '').toUpperCase()}
                    </p>
                  )}
                </div>

                {/* Check icon if has attachment */}
                {hasAttachment && (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="mt-4 space-y-2">
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Arquivos Anexados:
          </h5>
          <AnimatePresence>
            {attachments.map((attachment) => {
              const option = options.find(opt => opt.id === attachment.optionId)
              return (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {attachment.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {option?.label} • {attachment.type === 'file' ? 'Arquivo' : 'Link'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Remover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

export default StageAttachmentsManager
