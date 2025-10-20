import { QueueManager } from './redis'
import { db } from './db'

// Job types for different operations
export enum JobType {
  // Image processing
  IMAGE_RESIZE = 'IMAGE_RESIZE',
  IMAGE_OPTIMIZE = 'IMAGE_OPTIMIZE',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  
  // Export operations
  EXPORT_CV = 'EXPORT_CV',
  EXPORT_BULK = 'EXPORT_BULK',
  EXPORT_STATISTICS = 'EXPORT_STATISTICS',
  
  // Import operations
  IMPORT_EXCEL = 'IMPORT_EXCEL',
  IMPORT_CSV = 'IMPORT_CSV',
  
  // Email operations
  SEND_EMAIL = 'SEND_EMAIL',
  SEND_BULK_EMAIL = 'SEND_BULK_EMAIL',
  
  // Data processing
  PROCESS_CV = 'PROCESS_CV',
  GENERATE_REPORT = 'GENERATE_REPORT',
  CLEANUP_OLD_DATA = 'CLEANUP_OLD_DATA',
  
  // Background tasks
  SYNC_DATA = 'SYNC_DATA',
  BACKUP_DATABASE = 'BACKUP_DATABASE',
  UPDATE_STATISTICS = 'UPDATE_STATISTICS',
}

// Job priorities
export enum JobPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
}

// Job status
export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// Job interface
export interface Job {
  id: string
  type: JobType
  priority: JobPriority
  status: JobStatus
  data: any
  result?: any
  error?: string
  attempts: number
  maxAttempts: number
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  nextRetryAt?: Date
}

// Job processor interface
export interface JobProcessor {
  process(job: Job): Promise<any>
}

// Main job queue service
export class JobQueue {
  private static processors = new Map<JobType, JobProcessor>()
  private static isProcessing = false
  private static processingInterval: NodeJS.Timeout | null = null
  
  // Register a job processor
  static registerProcessor(type: JobType, processor: JobProcessor): void {
    this.processors.set(type, processor)
  }
  
  // Add a job to the queue
  static async addJob(
    type: JobType,
    data: any,
    options: {
      priority?: JobPriority
      delay?: number
      maxAttempts?: number
    } = {}
  ): Promise<string> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority: options.priority || JobPriority.NORMAL,
      status: JobStatus.PENDING,
      data,
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date(),
    }
    
    // Determine queue based on priority
    const queueName = this.getQueueName(job.priority)
    
    // Add to Redis queue
    await QueueManager.addJob(queueName, job)
    
    // Schedule delayed job if needed
    if (options.delay) {
      job.nextRetryAt = new Date(Date.now() + options.delay)
    }
    
    // Log job creation
    console.log(`Job ${job.id} of type ${type} added to queue ${queueName}`)
    
    return job.id
  }
  
  // Process jobs from queues
  static async processJobs(): Promise<void> {
    if (this.isProcessing) {
      return // Already processing
    }
    
    this.isProcessing = true
    
    try {
      // Process queues in priority order
      const queues = [
        JobPriority.URGENT,
        JobPriority.HIGH,
        JobPriority.NORMAL,
        JobPriority.LOW,
      ]
      
      for (const priority of queues) {
        const queueName = this.getQueueName(priority)
        const queueLength = await QueueManager.getQueueLength(queueName)
        
        if (queueLength > 0) {
          // Process a batch of jobs
          const batchSize = priority === JobPriority.URGENT ? 5 : 3
          
          for (let i = 0; i < Math.min(batchSize, queueLength); i++) {
            const jobData = await QueueManager.getJob(queueName)
            
            if (jobData) {
              await this.processJob(jobData as Job)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing jobs:', error)
    } finally {
      this.isProcessing = false
    }
  }
  
  // Process a single job
  private static async processJob(job: Job): Promise<void> {
    const processor = this.processors.get(job.type)
    
    if (!processor) {
      console.error(`No processor registered for job type: ${job.type}`)
      job.status = JobStatus.FAILED
      job.error = 'No processor available'
      await this.saveJobResult(job)
      return
    }
    
    try {
      console.log(`Processing job ${job.id} of type ${job.type}`)
      
      job.status = JobStatus.PROCESSING
      job.startedAt = new Date()
      job.attempts++
      
      // Process the job
      const result = await processor.process(job)
      
      // Mark as completed
      job.status = JobStatus.COMPLETED
      job.result = result
      job.completedAt = new Date()
      
      console.log(`Job ${job.id} completed successfully`)
      
      await this.saveJobResult(job)
    } catch (error: any) {
      console.error(`Job ${job.id} failed:`, error)
      
      job.error = error.message || 'Unknown error'
      
      // Check if should retry
      if (job.attempts < job.maxAttempts) {
        job.status = JobStatus.RETRYING
        job.nextRetryAt = new Date(Date.now() + this.getRetryDelay(job.attempts))
        
        // Re-queue for retry
        const queueName = this.getQueueName(job.priority)
        await QueueManager.addJob(queueName, job)
        
        console.log(`Job ${job.id} scheduled for retry attempt ${job.attempts + 1}`)
      } else {
        job.status = JobStatus.FAILED
        job.completedAt = new Date()
        
        console.error(`Job ${job.id} failed after ${job.attempts} attempts`)
        
        await this.saveJobResult(job)
      }
    }
  }
  
  // Save job result to database
  private static async saveJobResult(job: Job): Promise<void> {
    try {
      // Store in database for history
      await db.activityLog.create({
        data: {
          userId: 1, // System user
          action: `JOB_${job.status}`,
          description: `Job ${job.id} of type ${job.type} ${job.status.toLowerCase()}`,
          metadata: job as any,
          targetType: 'JOB',
          targetId: job.id,
        },
      })
    } catch (error) {
      console.error('Failed to save job result:', error)
    }
  }
  
  // Get queue name based on priority
  private static getQueueName(priority: JobPriority): string {
    switch (priority) {
      case JobPriority.URGENT:
        return 'jobs:urgent'
      case JobPriority.HIGH:
        return 'jobs:high'
      case JobPriority.LOW:
        return 'jobs:low'
      default:
        return 'jobs:normal'
    }
  }
  
  // Get retry delay based on attempt number
  private static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000) // Max 30 seconds
  }
  
  // Start job processing
  static startProcessing(intervalMs: number = 1000): void {
    if (this.processingInterval) {
      return // Already started
    }
    
    console.log('Starting job queue processing...')
    
    // Process immediately
    this.processJobs()
    
    // Set up interval
    this.processingInterval = setInterval(() => {
      this.processJobs()
    }, intervalMs)
  }
  
  // Stop job processing
  static stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      console.log('Job queue processing stopped')
    }
  }
  
  // Get queue statistics
  static async getStatistics(): Promise<{
    queues: { [key: string]: number }
    processing: boolean
    processors: string[]
  }> {
    const queues: { [key: string]: number } = {}
    
    for (const priority of [JobPriority.URGENT, JobPriority.HIGH, JobPriority.NORMAL, JobPriority.LOW]) {
      const queueName = this.getQueueName(priority)
      queues[queueName] = await QueueManager.getQueueLength(queueName)
    }
    
    return {
      queues,
      processing: this.isProcessing,
      processors: Array.from(this.processors.keys()),
    }
  }
}

// Example job processors
export class ImageProcessor implements JobProcessor {
  async process(job: Job): Promise<any> {
    const { imagePath, width, height, quality } = job.data
    
    // Simulate image processing
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // In real implementation, use sharp or similar library
    return {
      processedPath: imagePath.replace('.jpg', '_processed.jpg'),
      dimensions: { width, height },
      quality,
    }
  }
}

export class ExportProcessor implements JobProcessor {
  async process(job: Job): Promise<any> {
    const { cvIds, format } = job.data
    
    // Fetch CVs from database
    const cvs = await db.cV.findMany({
      where: {
        id: { in: cvIds },
      },
    })
    
    // Simulate export processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // In real implementation, generate actual export file
    return {
      fileUrl: `/exports/cvs_${Date.now()}.${format}`,
      count: cvs.length,
      format,
    }
  }
}

export class EmailProcessor implements JobProcessor {
  async process(job: Job): Promise<any> {
    const { to, subject, body, template } = job.data
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In real implementation, use nodemailer or similar
    return {
      messageId: `msg_${Date.now()}`,
      to,
      subject,
      sentAt: new Date(),
    }
  }
}

export class DataSyncProcessor implements JobProcessor {
  async process(job: Job): Promise<any> {
    const { source, target, options } = job.data
    
    // Simulate data synchronization
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    return {
      synced: true,
      recordsProcessed: 100,
      source,
      target,
    }
  }
}

// Register default processors
JobQueue.registerProcessor(JobType.IMAGE_RESIZE, new ImageProcessor())
JobQueue.registerProcessor(JobType.IMAGE_OPTIMIZE, new ImageProcessor())
JobQueue.registerProcessor(JobType.EXPORT_CV, new ExportProcessor())
JobQueue.registerProcessor(JobType.EXPORT_BULK, new ExportProcessor())
JobQueue.registerProcessor(JobType.SEND_EMAIL, new EmailProcessor())
JobQueue.registerProcessor(JobType.SYNC_DATA, new DataSyncProcessor())

export default JobQueue
