/**
 * Garante que .env.local exista antes de dev/build/start.
 * Mantém uma cópia de segurança fora do projeto (~/.cida/env.local)
 * para restaurar automaticamente se o arquivo local sumir.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs"
import { homedir } from "os"
import { dirname, join, resolve } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const envPath = join(root, ".env.local")
const backupDir = join(homedir(), ".cida")
const backupPath = join(backupDir, "env.local")

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
]

function parseEnv(raw) {
  const env = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const i = trimmed.indexOf("=")
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim()
  }
  return env
}

function validate(env, label) {
  const missing = REQUIRED.filter((k) => !env[k])
  if (missing.length) {
    return `${label} incompleto. Faltam: ${missing.join(", ")}`
  }
  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(env.NEXT_PUBLIC_SUPABASE_URL)) {
    return `${label}: NEXT_PUBLIC_SUPABASE_URL inválida (esperado https://….supabase.co)`
  }
  if (env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length < 40) {
    return `${label}: NEXT_PUBLIC_SUPABASE_ANON_KEY parece inválida`
  }
  return null
}

function ensureBackup(fromPath) {
  mkdirSync(backupDir, { recursive: true })
  copyFileSync(fromPath, backupPath)
}

function envFromProcess() {
  const env = {}
  for (const key of REQUIRED) {
    if (process.env[key]) env[key] = process.env[key]
  }
  return env
}

function main() {
  let restored = false

  // No Vercel (e CI), as variáveis vêm do painel — não há .env.local no repo.
  if (process.env.VERCEL || process.env.CI) {
    const err = validate(envFromProcess(), "variáveis de ambiente (Vercel/CI)")
    if (err) {
      console.error(`\n[cida] ERRO: ${err}\n`)
      process.exit(1)
    }
    console.log("[cida] Variáveis de ambiente OK (Vercel/CI)")
    return
  }

  if (!existsSync(envPath) && existsSync(backupPath)) {
    copyFileSync(backupPath, envPath)
    restored = true
    console.log(
      "[cida] .env.local estava ausente — restaurado da cópia em",
      backupPath,
    )
  }

  if (!existsSync(envPath)) {
    console.error(`
[cida] ERRO: .env.local não encontrado.

Sem este arquivo o app NÃO grava pacientes/receitas no Supabase.

1) Copie .env.example para .env.local
2) Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
   (Supabase → Project Settings → API)

Backup esperado em: ${backupPath}
`)
    process.exit(1)
  }

  // Remove BOM se existir
  let raw = readFileSync(envPath)
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    raw = raw.subarray(3)
    writeFileSync(envPath, raw)
    console.log("[cida] Removido BOM inválido de .env.local")
  }

  const text = raw.toString("utf8")
  const env = parseEnv(text)
  const err = validate(env, ".env.local")
  if (err) {
    console.error(`\n[cida] ERRO: ${err}\n`)
    process.exit(1)
  }

  try {
    ensureBackup(envPath)
    if (!restored) {
      console.log("[cida] .env.local OK — backup atualizado em", backupPath)
    }
  } catch (e) {
    console.warn(
      "[cida] Aviso: não foi possível gravar backup do .env.local:",
      e.message,
    )
  }
}

main()
