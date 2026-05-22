export function isValidUser(email: string): boolean {
    const raw = process.env.ALLOWED_EMAILS
    if (!raw || !email) return false

    let emailList: string[]
    try {
        emailList = JSON.parse(raw) as string[]
    } catch {
        emailList = raw.split(',').map(e => e.trim())
    }

    return emailList.includes(email)
}