# OpenCode V2 TUI Reference Plugin (`opencodev2-tui-reference`)

Production-grade, taşınabilir ve temiz **OpenCode V2 TUI Reference Implementation**.
Bu paket, OpenCode v2 TUI mimarisini öğrenmek, doğrulamak ve başka bir plugin reposuna temel yapı taşı olarak taşımak için hazırlanmıştır.

---

## 🚀 Kanıtlanan Temel Konseptler

1. **Native V2 Plugin Lifecycle (`{ id, setup(ctx) }`):**
   - Sunucu tarafı (`src/index.ts`) ve TUI tarafı (`src/tui.tsx`) için tam bağımsız, temiz lifecycle.
   - Hot-reload güvenliği: Tüm listener'lar, slot claim'leri ve route kayıtları `cleanup` fonksiyonu ile bellek sızıntısı olmadan geri alınır.

2. **`sidebar.content` Slot Claim:**
   - `ctx.ui.slot({ append: "sidebar.content", render: ... })` ile TUI yan paneline bileşen yerleşimi.

3. **SolidJS & OpenTUI Reaktif Bileşenler:**
   - `<box>`, `<text>` temel render öğeleri.
   - `createMemo`, `Show`, `For` ile sıfır gereksiz re-render.
   - `PluginErrorBoundary` ile render hatalarını yakalayan fallback ekranı.

4. **Session Isolation & State Yönetimi:**
   - **`ctx.storage.memory` (Ephemeral):** Hot reload sırasında hayatta kalan, oturum bazlı sayaç ve event telemetrisi (`src/state/session-store.ts`).
   - **`ctx.storage.store` (Durable/Disk):** TUI yeniden başlatılsa bile diske yazılan kalıcı tercihler (örn. kenar çubuğu daraltma/genişletme durumu - `src/state/persistent-store.ts`).

5. **OpenCode Live Data & Event Akışı:**
   - `ctx.data.listen` ve `ctx.data.on("session.status", ...)` ile canlı sunucu olaylarını oturum bazında izleme.
   - `ctx.data.session.status(sessionID)` ve `ctx.data.session.cost(sessionID)` reaktif takibi.
   - `ctx.data.location.vcs.info()` ile Git branch/VCS bilgisi.

6. **Custom Router & Standalone Sayfa (`/hctlab`):**
   - `ctx.ui.router.register({ name: "hctlab", render: ... })` ile tam sayfa özel görünüm.
   - `ctx.ui.router.navigate(...)` ile sayfalar arası geçiş.

7. **Keymap, Slash Commands & Toast:**
   - `/hctlab` -> HCTLab tam ekran görünümünü açar.
   - `/sidebar-toggle` -> Kenar çubuğu panelini daraltır / genişletir (kalıcı).
   - `/hct-increment` -> Aktif oturum sayacını artırır ve toast bildirimi basar.

8. **Theme Token Entegrasyonu:**
   - Sabit hardcoded renkler yerine `ctx.theme.text.*` ve `ctx.theme.background.*` dinamik RGBA tema tokenları.

---

## 📁 Proje Dizin Yapısı

```text
opencodev2-tui-denemee/
├── package.json               # Exports: "." -> index.ts, "./tui" -> tui.tsx
├── tsconfig.json              # Strict TypeScript + @opentui/solid JSX
├── src/
│   ├── index.ts               # Server Daemon plugin { id, tui: true, setup }
│   ├── tui.tsx                # TUI Client plugin { id, setup } & cleanup
│   ├── types.ts               # Strict modeller (Zero 'any')
│   ├── state/
│   │   ├── session-store.ts   # ctx.storage.memory oturum izolasyonu
│   │   └── persistent-store.ts# ctx.storage.store disk persistence
│   ├── tui/
│   │   ├── slots.tsx          # Slot claim (sidebar.content)
│   │   ├── router.tsx         # Router register (/hctlab) ve navigation
│   │   ├── commands.ts        # Keymap layer ve slash commands
│   │   └── events.ts          # ctx.data event dinleyicileri
│   ├── components/
│   │   ├── ErrorBoundary.tsx  # Solid ErrorBoundary bileşeni
│   │   ├── SidebarPanel.tsx   # Canlı kenar çubuğu widget'ı
│   │   └── HctLabPage.tsx     # Bağımsız referans sayfa görünümü
│   └── utils/
│       └── format.ts          # Maliyet, zaman ve metin formatlayıcılar
└── test/
    ├── state.test.ts          # State & Session izolasyon testleri
    └── lifecycle.test.ts      # Plugin sözleşme ve cleanup testleri
```

---

## ⚙️ OpenCode Konfigürasyonuna Ekleme

Bu eklentiyi yerel geliştirme ortamınızda aktifleştirmek için OpenCode yapılandırma dosyanıza (`~/.config/opencode-v2/opencode/opencode.json` veya `opencode.json`) ekleyin:

```json
{
  "plugins": [
    "/home/berkay/Opencode-Works/opencodev2-tui-denemee"
  ]
}
```

> **Not:** Eklenti paketinin `package.json` dosyasında `exports` tanımlı olduğu ve `src/index.ts` içerisinde `tui: true` belirtildiği için hem OpenCode sunucusu hem de OpenCode TUI istemcisi eklentiyi otomatik olarak yükler.

---

## 🧪 Testleri Çalıştırma

```bash
# Tip kontrolü (Strict TypeScript, 0 error)
bun run typecheck

# Birim ve entegrasyon testleri
bun test
```
