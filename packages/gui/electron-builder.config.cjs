const publishUrl = process.env.VUE_APP_PUBLISH_URL
const publishProvider = process.env.VUE_APP_PUBLISH_PROVIDER

// 本地开发自动检测当前平台和架构，CI 构建全部架构
const isCI = !!process.env.CI
const localArch = process.arch === 'ia32' ? 'ia32' : process.arch === 'arm64' ? 'arm64' : 'x64'

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'dev-sidecar',
  productName: 'dev-sidecar',
  artifactName: 'DevSidecar-${version}-${arch}.${ext}',
  copyright: 'Copyright © 2020-' + new Date().getFullYear() + ' Greper, WangLiang, CuteOmega',
  directories: {
    output: 'dist_electron',
    buildResources: 'build',
  },
  asar: {
    smartUnpack: true,
  },
  asarUnpack: [
    'src/bridge/mitmproxy.js',
    'dist/icon.png',
  ],
  files: [
    {
      from: 'dist',
      to: 'dist',
      filter: [
        '**/*',
        '!win-*/**/*',
        '!mac-*/**/*',
        '!linux-*/**/*',
        '!*.zip',
        '!*.dmg',
        '!*.blockmap',
        '!*.exe',
        '!*.AppImage',
        '!*.deb',
        '!*.rpm',
        '!*.tar.gz',
        '!*.flatpak',
        '!builder-*.yml',
        '!builder-*.yaml',
      ],
    },
    'src/**/*',
    'package.json',
    // extra/ 在 extraResources 中已复制，此处不需要再打包进 asar
  ],
  extraResources: [
    {
      from: 'extra',
      to: 'extra',
    },
  ],
  afterPack: './pkg/after-pack.cjs',
  afterAllArtifactBuild: './pkg/after-all-artifact-build.cjs',
  nsis: {
    oneClick: false,
    perMachine: true,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
  },
  win: {
    icon: 'build/icons/',
    signAndEditExecutable: false, // 强制在CI和本地均跳过签名，解决无证书导致构建失败的问题
    target: isCI
      ? [
          { target: 'nsis', arch: ['x64'] },
          { target: 'nsis', arch: ['ia32'] },
          { target: 'nsis', arch: ['arm64'] },
        ]
      : [
          { target: 'nsis', arch: [localArch] },
        ],
  },
  linux: {
    icon: 'build/mac/',
    executableName: 'dev-sidecar', // 解决 AppImage 路径非法字符报错
    target: isCI
      ? [
          { target: 'deb', arch: ['x64', 'arm64', 'armv7l'] },
          { target: 'AppImage', arch: ['x64', 'arm64', 'armv7l'] },
          { target: 'tar.gz', arch: ['x64', 'arm64', 'armv7l'] },
          { target: 'rpm', arch: ['x64', 'arm64', 'armv7l'] },
          // { target: 'flatpak', arch: ['x64'] }, // <--- 已修改：删掉了这行！避免 CI 环境找不到 flatpak 命令导致报错
          // Arch Linux (fpm/pacman), 产物为 .pkg.tar.xz, 可直接 pacman -U 安装
          {
            target: 'pacman',
            arch: ['x64', 'arm64'],
          },
        ]
      : [
          { target: 'deb', arch: [localArch] },
          { target: 'AppImage', arch: [localArch] },
        ],
    appId: 'cn.docmirror.DevSidecar',
    category: 'System',
  },
  mac: {
    icon: './build/mac/icon.icns',
    identity: null, // 强制跳过 macOS 签名，避免无证书报错
    target: isCI
      ? [
          { target: 'dmg', arch: ['x64', 'arm64'] },
          { target: 'zip', arch: ['x64', 'arm64'] },
        ]
      : { target: 'dmg', arch: [localArch] },
    category: 'public.app-category.developer-tools',
  },
  publish: publishProvider
    ? {
        provider: publishProvider,
        url: publishUrl,
      }
    : undefined,
}
