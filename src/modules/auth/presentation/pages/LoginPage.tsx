import symbolUrl from "@/assets/brand/symbol.webp";
import { Logo } from "@/components/brand/Logo";
import SignInForm from "../ui/SignInForm";

export function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-100 flex-col">
      <div className="mb-10 flex flex-col items-center text-center">
        <img
          src={symbolUrl}
          alt=""
          aria-hidden
          className="cc-float mb-7 size-14 object-contain opacity-95 sm:size-16"
        />

        <Logo className="justify-center" />

        <p className="mt-6 font-semibold text-primary text-sm uppercase tracking-[0.2em]">
          Admin
        </p>

        <h1 className="mt-3 text-balance font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
          ເຂົ້າສູ່ລະບົບ
        </h1>

        <p className="mt-3 max-w-sm text-pretty text-base text-muted-foreground leading-relaxed">
          ໃສ່ອີເມວ ແລະ ລະຫັດຜ່ານເພື່ອເຂົ້າໃຊ້ແຜງຄວບຄຸມ ClickCraft
        </p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-background/80 p-6 shadow-[0_20px_50px_-28px_rgba(26,26,26,0.28)] backdrop-blur-sm sm:p-7 dark:bg-card/80 dark:shadow-[0_20px_50px_-28px_rgba(0,0,0,0.55)]">
        <SignInForm />
      </div>

      <p className="mt-8 text-center text-muted-foreground text-xs leading-relaxed">
        ຄລິກດຽວຈົບ ຄຣາຟຊອບແວທີ່ຕອບໂຈດທຸລະກິດທ່ານ
      </p>
    </div>
  );
}
