// AI Chatbot Service for Bus Grievances
// Note: Install @google/generative-ai package for full functionality

// Configuration
const GOOGLE_API_KEY = 'AIzaSyDnqz_rdb4diwG9tgdGzXbwFgVqGc-QKIU'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  category?: 'general' | 'grievance' | 'bus_info' | 'schedule' | 'complaint' | 'error'
}

interface GrievanceAnalysis {
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  keywords: string[]
  sentiment: 'positive' | 'negative' | 'neutral'
  requiresEscalation: boolean
}

class AIGrievanceChatbot {
  private conversationHistory: ChatMessage[] = []

  constructor() {
    this.initializeSystemPrompt()
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(`${API_URL}?key=${GOOGLE_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.candidates[0].content.parts[0].text
    } catch (error) {
      console.error('Gemini API error:', error)
      throw error
    }
  }

  private async initializeSystemPrompt() {
    const systemMessage = `You are an AI assistant for a bus transportation system in Punjab, India. 
    Help users with bus-related grievances, provide schedule information, route guidance, and general support.
    Be helpful, concise, and professional. Always try to provide actionable solutions.`
    
    try {
      const response = await this.callGeminiAPI(systemMessage)
      console.log('AI Chatbot initialized successfully')
    } catch (error) {
      console.error('Failed to initialize AI system:', error)
    }
  }

  categorizeGrievance(message: string): GrievanceAnalysis {
    const lowerMessage = message.toLowerCase()
    
    // Define keywords for each category
    const categoryKeywords = {
      schedule: ['schedule', 'time', 'timing', 'late', 'early', 'delay', 'departure', 'arrival'],
      route: ['route', 'stop', 'station', 'direction', 'where', 'location', 'destination'],
      complaint: ['complaint', 'problem', 'issue', 'bad', 'terrible', 'awful', 'poor', 'worst'],
      payment: ['payment', 'ticket', 'fare', 'money', 'cost', 'price', 'refund', 'charged'],
      lost_found: ['lost', 'found', 'left', 'forgot', 'missing', 'belongings'],
      accessibility: ['wheelchair', 'disabled', 'accessibility', 'handicap', 'special needs'],
      safety: ['safety', 'accident', 'dangerous', 'unsafe', 'emergency', 'help']
    }

    // Determine category based on keywords
    let category = 'general'
    let maxMatches = 0
    let keywords: string[] = []

    for (const [cat, catKeywords] of Object.entries(categoryKeywords)) {
      const matches = catKeywords.filter(keyword => lowerMessage.includes(keyword))
      if (matches.length > maxMatches) {
        maxMatches = matches.length
        category = cat
        keywords = matches
      }
    }

    // Determine priority based on keywords and sentiment
    const urgentKeywords = ['emergency', 'accident', 'stuck', 'stranded', 'urgent', 'help']
    const highKeywords = ['complaint', 'problem', 'terrible', 'awful', 'worst', 'dangerous']
    const mediumKeywords = ['late', 'delay', 'issue', 'problem', 'bad']

    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low'
    if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
      priority = 'urgent'
    } else if (highKeywords.some(keyword => lowerMessage.includes(keyword))) {
      priority = 'high'
    } else if (mediumKeywords.some(keyword => lowerMessage.includes(keyword))) {
      priority = 'medium'
    }

    // Determine sentiment
    const positiveKeywords = ['good', 'great', 'excellent', 'thank', 'appreciate', 'helpful']
    const negativeKeywords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'angry', 'frustrated']
    
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    if (positiveKeywords.some(keyword => lowerMessage.includes(keyword))) {
      sentiment = 'positive'
    } else if (negativeKeywords.some(keyword => lowerMessage.includes(keyword))) {
      sentiment = 'negative'
    }

    // Determine if escalation is required
    const requiresEscalation = priority === 'urgent' || priority === 'high'

    return {
      category,
      priority,
      keywords,
      sentiment,
      requiresEscalation
    }
  }

  private generateSystemMessage(userMessage: string, analysis: GrievanceAnalysis): string {
    const context = `
User Message: "${userMessage}"
Category: ${analysis.category}
Priority: ${analysis.priority}
Sentiment: ${analysis.sentiment}
Keywords: ${analysis.keywords.join(', ')}

Please respond as a helpful AI assistant for a bus transportation system in Punjab, India. 
Provide specific, actionable advice based on the user's concern. If this is a complaint or urgent issue, 
acknowledge their frustration and provide clear next steps.

Guidelines:
- Be empathetic and understanding
- Provide specific solutions where possible
- Include relevant contact information if needed
- Keep responses concise but helpful
- If urgent, emphasize immediate action steps
`
    return context
  }

  async processUserMessage(userMessage: string): Promise<ChatMessage> {
    try {
      // Add user message to history
      const userChatMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        category: 'grievance'
      }
      this.conversationHistory.push(userChatMessage)

      // Analyze the grievance
      const analysis = this.categorizeGrievance(userMessage)
      
      // Generate system message with context
      const systemMessage = this.generateSystemMessage(userMessage, analysis)
      
      // Get AI response
      const aiResponse = await this.callGeminiAPI(systemMessage)

      // Add AI response to history
      const aiChatMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        category: analysis.category as any
      }
      this.conversationHistory.push(aiChatMessage)

      // Store conversation in localStorage for persistence
      this.saveConversation()

      return aiChatMessage
    } catch (error) {
      console.error('Error processing user message:', error)
      
      // Return a fallback response
      const fallbackResponse: ChatMessage = {
        id: `fallback_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again or contact our support team at support@punjabbus.gov.in for immediate assistance.',
        timestamp: new Date(),
        category: 'general'
      }
      
      this.conversationHistory.push(fallbackResponse)
      this.saveConversation()
      
      return fallbackResponse
    }
  }

  getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory]
  }

  clearConversation(): void {
    this.conversationHistory = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('busAI_conversation')
    }
  }

  saveConversation(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('busAI_conversation', JSON.stringify(this.conversationHistory))
    }
  }

  loadConversation(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('busAI_conversation')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          this.conversationHistory = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        } catch (error) {
          console.error('Failed to load conversation history:', error)
        }
      }
    }
  }

  async escalateIssue(messageId: string, reason: string): Promise<boolean> {
    try {
      // In a real implementation, this would integrate with a ticketing system
      console.log(`Escalating issue ${messageId} for reason: ${reason}`)
      
      // Here you would typically:
      // 1. Send to support ticket system
      // 2. Notify administrators
      // 3. Create case number
      // 4. Send confirmation to user
      
      return true
    } catch (error) {
      console.error('Failed to escalate issue:', error)
      return false
    }
  }
}

// Export singleton instance
export const aiChatbotService = new AIGrievanceChatbot()

// Initialize conversation on load (browser only)
if (typeof window !== 'undefined') {
  aiChatbotService.loadConversation()
}