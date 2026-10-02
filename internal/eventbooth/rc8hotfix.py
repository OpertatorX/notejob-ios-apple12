from pathlib import Path

root = Path("/tmp/eventbooth-src")

def replace_once(path, old, new):
    p = root / path
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"RC8_PATTERN_MISSING={path}")
    p.write_text(text.replace(old, new, 1))
    print(f"RC8_PATCHED={path}")

booth = "EventBooth/Features/Booth/BoothHomeView.swift"

replace_once(
    booth,
'''    GeometryReader { proxy in
      ZStack {
        themedCover''',
'''    GeometryReader { proxy in
      let compact = proxy.size.width < 700

      ZStack {
        themedCover'''
)

replace_once(
    booth,
'''        VStack(spacing: 20) {
          topBar
          titleBlock
          if isFreeTrial {
            freeTrialBadge
          }
          Spacer(minLength: 8)
          actionRow
          footer
        }
        .padding(.horizontal, max(30, min(48, proxy.size.width * 0.045)))
        .padding(.vertical, 26)''',
'''        VStack(spacing: compact ? 12 : 20) {
          topBar
          titleBlock(compact: compact)
          if isFreeTrial {
            freeTrialBadge(compact: compact)
          }
          Spacer(minLength: compact ? 0 : 8)
          actionLayout(compact: compact)
          footer(compact: compact)
        }
        .padding(.horizontal, compact ? 18 : max(30, min(48, proxy.size.width * 0.045)))
        .padding(.vertical, compact ? 14 : 26)'''
)

replace_once(
    booth,
'''  private var titleBlock: some View {
    VStack(spacing: 8) {
      Text("booth.welcome")
        .font(.system(size: 15, weight: .medium))
        .tracking(4.7)
        .foregroundStyle(.white.opacity(0.9))

      if store.settings.showEventName {
        Text(event.name)
          .ebSerif(72)
          .foregroundStyle(.white)
          .minimumScaleFactor(0.5)
          .lineLimit(1)
          .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
      }

      Text(elegantDate)
        .ebSerif(27)
        .tracking(4.6)
        .foregroundStyle(.white.opacity(0.96))
    }
    .frame(maxWidth: .infinity)
  }''',
'''  private func titleBlock(compact: Bool) -> some View {
    VStack(spacing: compact ? 6 : 8) {
      Text("booth.welcome")
        .font(.system(size: compact ? 12 : 15, weight: .medium))
        .tracking(compact ? 2.8 : 4.7)
        .foregroundStyle(.white.opacity(0.9))
        .lineLimit(1)
        .minimumScaleFactor(0.62)

      if store.settings.showEventName {
        Text(event.name)
          .ebSerif(compact ? 54 : 72)
          .foregroundStyle(.white)
          .minimumScaleFactor(0.5)
          .lineLimit(1)
          .shadow(color: .black.opacity(0.12), radius: 8, y: 2)
      }

      Text(elegantDate)
        .ebSerif(compact ? 20 : 27)
        .tracking(compact ? 3 : 4.6)
        .foregroundStyle(.white.opacity(0.96))
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity)
  }'''
)

replace_once(
    booth,
'''  private var actionRow: some View {
    HStack(spacing: 14) {
      if event.features.photos {
        EBGlassActionCard(icon: "camera.fill", title: "booth.photo", subtitle: "booth.photo.sub") {
          open(.photo)
        }
      }

      if event.features.videos {
        EBGlassActionCard(icon: "video.fill", title: "booth.video", subtitle: "booth.video.sub") {
          open(.video)
        }
      }

      if event.features.voice {
        EBGlassActionCard(icon: "mic.fill", title: "booth.voice", subtitle: "booth.voice.sub") {
          open(.voice)
        }
      }

      if event.features.guestbook {
        EBGlassActionCard(
          icon: "pencil",
          title: "booth.guestbook",
          subtitle: "booth.guestbook.sub"
        ) {
          open(.guestbook)
        }
      }
    }
    .frame(maxWidth: 1000)
  }''',
'''  @ViewBuilder
  private func actionLayout(compact: Bool) -> some View {
    if compact {
      LazyVGrid(
        columns: [
          GridItem(.flexible(minimum: 0), spacing: 12),
          GridItem(.flexible(minimum: 0), spacing: 12),
        ],
        spacing: 12
      ) {
        actionCards(compact: true)
      }
      .frame(maxWidth: .infinity)
    } else {
      HStack(spacing: 14) {
        actionCards(compact: false)
      }
      .frame(maxWidth: 1000)
    }
  }

  @ViewBuilder
  private func actionCards(compact: Bool) -> some View {
    if event.features.photos {
      EBGlassActionCard(
        icon: "camera.fill", title: "booth.photo", subtitle: "booth.photo.sub", compact: compact
      ) {
        open(.photo)
      }
    }

    if event.features.videos {
      EBGlassActionCard(
        icon: "video.fill", title: "booth.video", subtitle: "booth.video.sub", compact: compact
      ) {
        open(.video)
      }
    }

    if event.features.voice {
      EBGlassActionCard(
        icon: "mic.fill", title: "booth.voice", subtitle: "booth.voice.sub", compact: compact
      ) {
        open(.voice)
      }
    }

    if event.features.guestbook {
      EBGlassActionCard(
        icon: "pencil", title: "booth.guestbook", subtitle: "booth.guestbook.sub",
        compact: compact
      ) {
        open(.guestbook)
      }
    }
  }'''
)

replace_once(
    booth,
'''  private var footer: some View {
    VStack(spacing: 4) {
      Text("booth.thankyou")
        .font(.custom("Snell Roundhand", size: 38))
        .foregroundStyle(.white)
        .shadow(color: .black.opacity(0.18), radius: 8, y: 2)
      Text("booth.thankyou.sub")
        .font(.system(size: 10, weight: .medium))
        .tracking(4)
        .foregroundStyle(.white.opacity(0.84))
    }
    .padding(.top, 2)
  }''',
'''  private func footer(compact: Bool) -> some View {
    VStack(spacing: 4) {
      Text("booth.thankyou")
        .font(.custom("Snell Roundhand", size: compact ? 30 : 38))
        .foregroundStyle(.white)
        .shadow(color: .black.opacity(0.18), radius: 8, y: 2)
      Text("booth.thankyou.sub")
        .font(.system(size: compact ? 9 : 10, weight: .medium))
        .tracking(compact ? 3.2 : 4)
        .foregroundStyle(.white.opacity(0.84))
        .lineLimit(1)
    }
    .padding(.top, compact ? 0 : 2)
  }'''
)

replace_once(
    booth,
'''  private var freeTrialBadge: some View {
    let remaining = store.remainingFreeCaptures(for: event.id)
    return HStack(spacing: 7) {
      Image(systemName: "sparkles")
      Text(
        String(
          format: String(localized: "booth.testmode", locale: locale),
          remaining
        )
      )
    }
    .font(.system(size: 11, weight: .semibold))
    .foregroundStyle(.white)
    .padding(.horizontal, 12)
    .frame(height: 30)
    .background(Color.black.opacity(0.22), in: Capsule())
    .overlay { Capsule().stroke(Color.white.opacity(0.14), lineWidth: 0.8) }
  }''',
'''  private func freeTrialBadge(compact: Bool) -> some View {
    let remaining = store.remainingFreeCaptures(for: event.id)
    return HStack(spacing: 7) {
      Image(systemName: "sparkles")
      Text(
        String(
          format: String(localized: "booth.testmode", locale: locale),
          remaining
        )
      )
      .lineLimit(1)
      .minimumScaleFactor(0.72)
    }
    .font(.system(size: compact ? 10 : 11, weight: .semibold))
    .foregroundStyle(.white)
    .padding(.horizontal, compact ? 10 : 12)
    .frame(maxWidth: compact ? .infinity : nil)
    .frame(height: compact ? 28 : 30)
    .background(Color.black.opacity(0.22), in: Capsule())
    .overlay { Capsule().stroke(Color.white.opacity(0.14), lineWidth: 0.8) }
  }'''
)

design = "EventBooth/DesignSystem/DesignSystem.swift"
replace_once(
    design,
'''struct EBGlassActionCard: View {
  let icon: String
  let title: LocalizedStringKey
  let subtitle: LocalizedStringKey
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(spacing: 15) {
        Image(systemName: icon)
          .font(.system(size: 28, weight: .semibold))
          .foregroundStyle(Color.ebCharcoal)
          .frame(width: 70, height: 70)
          .background(Color.ebIvory, in: Circle())
        Text(title)
          .font(.system(size: 22, weight: .medium))
          .multilineTextAlignment(.center)
          .foregroundStyle(.white)
          .lineSpacing(-1)
        Text(subtitle)
          .font(.system(size: 10, weight: .medium))
          .tracking(1.5)
          .foregroundStyle(.white.opacity(0.78))
          .multilineTextAlignment(.center)
      }
      .padding(.horizontal, 14)
      .frame(maxWidth: .infinity, minHeight: 214)
      .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
      .background(
        Color.black.opacity(0.34), in: RoundedRectangle(cornerRadius: 28, style: .continuous)
      )
      .overlay {
        RoundedRectangle(cornerRadius: 28, style: .continuous)
          .stroke(Color.white.opacity(0.15), lineWidth: 1)
      }
    }
    .buttonStyle(.plain)
  }
}''',
'''struct EBGlassActionCard: View {
  let icon: String
  let title: LocalizedStringKey
  let subtitle: LocalizedStringKey
  var compact = false
  let action: () -> Void

  var body: some View {
    Button(action: action) {
      VStack(spacing: compact ? 9 : 15) {
        Image(systemName: icon)
          .font(.system(size: compact ? 22 : 28, weight: .semibold))
          .foregroundStyle(Color.ebCharcoal)
          .frame(width: compact ? 54 : 70, height: compact ? 54 : 70)
          .background(Color.ebIvory, in: Circle())
        Text(title)
          .font(.system(size: compact ? 17 : 22, weight: .medium))
          .multilineTextAlignment(.center)
          .foregroundStyle(.white)
          .lineSpacing(-1)
          .lineLimit(2)
          .minimumScaleFactor(0.82)
          .fixedSize(horizontal: false, vertical: true)
        Text(subtitle)
          .font(.system(size: compact ? 9 : 10, weight: .medium))
          .tracking(compact ? 1.05 : 1.5)
          .foregroundStyle(.white.opacity(0.78))
          .multilineTextAlignment(.center)
          .lineLimit(2)
          .minimumScaleFactor(0.78)
      }
      .padding(.horizontal, compact ? 10 : 14)
      .padding(.vertical, compact ? 12 : 0)
      .frame(maxWidth: .infinity, minHeight: compact ? 158 : 214)
      .background(
        .ultraThinMaterial,
        in: RoundedRectangle(cornerRadius: compact ? 23 : 28, style: .continuous)
      )
      .background(
        Color.black.opacity(0.34),
        in: RoundedRectangle(cornerRadius: compact ? 23 : 28, style: .continuous)
      )
      .overlay {
        RoundedRectangle(cornerRadius: compact ? 23 : 28, style: .continuous)
          .stroke(Color.white.opacity(0.15), lineWidth: 1)
      }
    }
    .buttonStyle(.plain)
  }
}'''
)

print("RC8_HOTFIX=PASS")
