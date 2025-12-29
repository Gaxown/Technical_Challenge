import { prisma } from './database';
import { Summary } from '../types';

export class SummaryModel {
  static async create(data: Omit<Summary, 'id' | 'createdAt' | 'updatedAt'>): Promise<Summary> {
    const now = new Date().toISOString();

    const summary = await prisma.summary.create({
      data: {
        voiceNoteId: data.voiceNoteId,
        content: data.content,
        keywords: data.keywords ? JSON.stringify(data.keywords) : null,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapPrismaToSummary(summary);
  }

  static async findById(id: string): Promise<Summary | undefined> {
    const summary = await prisma.summary.findUnique({
      where: { id },
    });

    if (!summary) return undefined;
    return this.mapPrismaToSummary(summary);
  }

  static async findByVoiceNoteId(voiceNoteId: string): Promise<Summary | undefined> {
    const summary = await prisma.summary.findFirst({
      where: { voiceNoteId },
      orderBy: { createdAt: 'desc' },
    });

    if (!summary) return undefined;
    return this.mapPrismaToSummary(summary);
  }

  static async findAll(): Promise<Summary[]> {
    const summaries = await prisma.summary.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return summaries.map(this.mapPrismaToSummary);
  }

  static async update(
    id: string,
    data: Partial<Omit<Summary, 'id' | 'voiceNoteId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Summary | undefined> {
    try {
      const summary = await prisma.summary.update({
        where: { id },
        data: {
          ...(data.content !== undefined && { content: data.content }),
          ...(data.keywords !== undefined && { keywords: JSON.stringify(data.keywords) }),
          updatedAt: new Date().toISOString(),
        },
      });

      return this.mapPrismaToSummary(summary);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return undefined;
      }
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await prisma.summary.delete({
        where: { id },
      });
      return true;
    } catch (error: any) {
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  private static mapPrismaToSummary(summary: any): Summary {
    return {
      id: summary.id,
      voiceNoteId: summary.voiceNoteId,
      content: summary.content,
      keywords: summary.keywords ? JSON.parse(summary.keywords) : undefined,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  }
}
