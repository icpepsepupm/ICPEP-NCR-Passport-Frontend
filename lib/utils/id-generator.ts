// ID generation utilities for ICPEP NCR Passport System
// Format: ICPEPSE-NCR-{SCHOOLCODE}-{ID}

export const idGenerator = {
  // Generate full ID from components
  generateFullId(schoolCode: string, userId: string): string {
    return `ICPEPSE-NCR-${schoolCode.toUpperCase()}-${userId.toUpperCase()}`
  },

  // Parse full ID back to components
  parseFullId(fullId: string): { schoolCode: string; userId: string } | null {
    const pattern = /^ICPEPSE-NCR-([A-Z0-9]+)-([A-Z0-9]+)$/i
    const match = fullId.match(pattern)
    
    if (!match) return null
    
    return {
      schoolCode: match[1],
      userId: match[2],
    }
  },

  // Validate ID format
  isValidFullId(fullId: string): boolean {
    const pattern = /^ICPEPSE-NCR-[A-Z0-9]+-[A-Z0-9]+$/i
    return pattern.test(fullId)
  },

  // Generate school code from school name
  generateSchoolCode(schoolName: string): string {
    return schoolName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3) // Max 3 chars
  },

  // Generate user ID (6 char alphanumeric)
  generateUserId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },
}
