import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateCommission(price: number) {
  const platformFee = price * 0.05;
  const transactionFee = 0;
  return {
    platformFee,
    transactionFee,
    total: platformFee + transactionFee
  };
}

export function getOnlineStatus(lastActiveAt?: any) {
  if (!lastActiveAt) return 'Long ago';
  let lastActive: Date;
  try {
    if (typeof lastActiveAt.toDate === 'function') {
      lastActive = lastActiveAt.toDate();
    } else if (lastActiveAt && typeof lastActiveAt.toMillis === 'function') {
      lastActive = new Date(lastActiveAt.toMillis());
    } else if (lastActiveAt && typeof lastActiveAt.seconds === 'number') {
      lastActive = new Date(lastActiveAt.seconds * 1000);
    } else if (lastActiveAt instanceof Date) {
      lastActive = lastActiveAt;
    } else {
      lastActive = new Date(lastActiveAt);
    }
  } catch (err) {
    console.error('Error parsing lastActiveAt:', err);
    return 'Long ago';
  }

  if (!lastActive || isNaN(lastActive.getTime())) return 'Long ago';
  const now = new Date();
  const diffInMs = now.getTime() - lastActive.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);

  if (diffInMinutes < 5) return 'Active now';
  
  const totalHours = Math.floor(diffInMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const days = remainingDaysAfterYears % 30;
  const hours = totalHours % 24;
  const minutes = diffInMinutes % 60;

  if (years > 0) {
    return `${years}y ${months}mo ${days}d ago`;
  }
  if (months > 0) {
    return `${months}mo ${days}d ago`;
  }
  if (days > 0) {
    return `${days}d ${hours}h ago`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
}

export function isUserOnline(lastActiveAt?: any): boolean {
  if (!lastActiveAt) return false;
  try {
    let lastActive: Date;
    if (typeof lastActiveAt.toDate === 'function') {
      lastActive = lastActiveAt.toDate();
    } else if (lastActiveAt && typeof lastActiveAt.toMillis === 'function') {
      lastActive = new Date(lastActiveAt.toMillis());
    } else if (lastActiveAt && typeof lastActiveAt.seconds === 'number') {
      lastActive = new Date(lastActiveAt.seconds * 1000);
    } else if (lastActiveAt instanceof Date) {
      lastActive = lastActiveAt;
    } else {
      lastActive = new Date(lastActiveAt);
    }
    if (!lastActive || isNaN(lastActive.getTime())) return false;
    const diffInMs = new Date().getTime() - lastActive.getTime();
    return Math.floor(diffInMs / 60000) < 5;
  } catch {
    return false;
  }
}

export function convertHtmlToMarkdown(htmlString: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const body = doc.body;

    function processNode(node: Node): string {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      let childrenContent = '';
      
      for (let i = 0; i < el.childNodes.length; i++) {
        childrenContent += processNode(el.childNodes[i]);
      }

      switch (tagName) {
        case 'p':
        case 'div': {
          let styleAttr = el.getAttribute('style') || '';
          if (styleAttr.includes('color')) {
            const colorMatch = styleAttr.match(/color:\s*([^;]+)/);
            if (colorMatch && colorMatch[1]) {
              return `\n<span style="color: ${colorMatch[1].trim()}">${childrenContent}</span>\n`;
            }
          }
          return `\n${childrenContent}\n`;
        }
        case 'br':
          return '\n';
        case 'h1':
          return `\n# ${childrenContent.trim()}\n`;
        case 'h2':
          return `\n## ${childrenContent.trim()}\n`;
        case 'h3':
          return `\n### ${childrenContent.trim()}\n`;
        case 'h4':
          return `\n#### ${childrenContent.trim()}\n`;
        case 'strong':
        case 'b':
          return `**${childrenContent}**`;
        case 'em':
        case 'i':
          return `*${childrenContent}*`;
        case 'u':
          return `_${childrenContent}_`;
        case 'span': {
          let styleAttr = el.getAttribute('style') || '';
          if (styleAttr.includes('color')) {
            const colorMatch = styleAttr.match(/color:\s*([^;]+)/);
            if (colorMatch && colorMatch[1]) {
              return `<span style="color: ${colorMatch[1].trim()}">${childrenContent}</span>`;
            }
          }
          return childrenContent;
        }
        case 'font': {
          const colorAttr = el.getAttribute('color');
          if (colorAttr) {
            return `<span style="color: ${colorAttr.trim()}">${childrenContent}</span>`;
          }
          return childrenContent;
        }
        case 'ul':
          return `\n${childrenContent}\n`;
        case 'ol':
          return `\n${childrenContent}\n`;
        case 'li': {
          const parentTag = el.parentElement?.tagName.toLowerCase();
          if (parentTag === 'ol') {
            return `1. ${childrenContent.trim()}\n`;
          }
          return `* ${childrenContent.trim()}\n`;
        }
        case 'blockquote':
          return `\n> ${childrenContent.trim()}\n`;
        case 'pre':
        case 'code':
          return ` \`${childrenContent}\` `;
        case 'a': {
          const href = el.getAttribute('href') || '#';
          return `[${childrenContent}](${href})`;
        }
        default:
          return childrenContent;
      }
    }

    let markdown = '';
    for (let i = 0; i < body.childNodes.length; i++) {
      markdown += processNode(body.childNodes[i]);
    }

    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error);
    return htmlString;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Resizes an image to ensure it stays within a reasonable size for base64 storage in Firestore.
 */
export async function resizeImage(file: File, maxWidth = 800, maxHeight = 600, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export async function createNotification(userId: string, title: string, message: string, type: string = 'system', link: string = '') {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
