export interface User {
    id: string
    name: string
    role: string
}

export function setAuthCookie(user: User) {
    // Expires in 7 days
    const d = new Date()
    d.setTime(d.getTime() + 7 * 24 * 60 * 60 * 1000)
    const expires = "expires=" + d.toUTCString()
    document.cookie = `auth_user=${JSON.stringify(user)};${expires};path=/`
}

export function getAuthCookie(): User | null {
    const name = "auth_user="
    const decodedCookie = decodeURIComponent(document.cookie)
    const ca = decodedCookie.split(';')
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }
        if (c.indexOf(name) == 0) {
            try {
                return JSON.parse(c.substring(name.length, c.length))
            } catch (e) {
                return null
            }
        }
    }
    return null
}

export function removeAuthCookie() {
    document.cookie = "auth_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
}
