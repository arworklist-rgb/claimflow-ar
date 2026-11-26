export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1200px]">{children}</div>
    </div>
  );
}
