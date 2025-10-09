import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';
import { db } from '@/lib/db';
import JSZip from 'jszip';
import { extractGoogleDriveFileId } from '@/lib/google-drive-utils';

async function fetchWithRetry(url: string, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Failed to fetch after multiple retries');
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await AuthService.verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const idsParam = request.nextUrl.searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 });
    }

    const cvIds = idsParam.split(',').map(id => id.trim());

    const cvs = await db.cV.findMany({
      where: {
        id: { in: cvIds },
      },
      select: {
        id: true,
        fullName: true,
        referenceCode: true,
        cvImageUrl: true,
      },
    });

    if (cvs.length === 0) {
      return NextResponse.json({ error: 'No CVs found' }, { status: 404 });
    }

    const zip = new JSZip();

    for (const cv of cvs) {
      if (cv.cvImageUrl) {
        const fileId = extractGoogleDriveFileId(cv.cvImageUrl);
        if (fileId) {
          try {
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            const response = await fetchWithRetry(downloadUrl);
            const imageBuffer = await response.arrayBuffer();
            const filename = `${cv.fullName}_${cv.referenceCode || cv.id}.jpg`.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_');
            zip.file(filename, imageBuffer);
          } catch (error) {
            console.error(`Failed to download image for ${cv.fullName}:`, error);
          }
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="CVs-${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });

  } catch (error) {
    console.error('Bulk download error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
