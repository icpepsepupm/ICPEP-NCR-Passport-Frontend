// QR Code generation and storage utility
import QRCode from 'qrcode'

export const qrCodeService = {
  // Generate QR code as buffer
  async generateQRBuffer(
    text: string,
    options?: {
      size?: number
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
      type?: 'png'
    }
  ) {
    try {
      const size = options?.size || 300
      const errorCorrectionLevel = options?.errorCorrectionLevel || 'H'
      const type = options?.type || 'png'

      const buffer = await QRCode.toBuffer(text, {
        errorCorrectionLevel,
        type,
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return { buffer, error: null }
    } catch (error) {
      console.error('QR Code generation failed:', error)
      return { buffer: null, error }
    }
  },

  // Generate QR code as data URL (for preview)
  async generateQRDataURL(
    text: string,
    options?: {
      size?: number
      errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    }
  ) {
    try {
      const size = options?.size || 300
      const errorCorrectionLevel = options?.errorCorrectionLevel || 'H'

      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel,
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      return { dataUrl, error: null }
    } catch (error) {
      console.error('QR Code data URL generation failed:', error)
      return { dataUrl: null, error }
    }
  },

  // Generate QR text format for members
  formatMemberQRText(memberId: string): string {
    return `MEMBER_ID:${memberId}`
  },
}
