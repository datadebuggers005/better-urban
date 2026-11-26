"""Central brand configuration. Override via env vars to rebrand."""
import os


def _parse_hashtags(raw: str) -> list[str]:
    return [tag.strip() for tag in raw.split(",") if tag.strip()]


class Brand:
    name: str = os.getenv("APP_NAME", "OCOR")
    tagline: str = os.getenv("APP_TAGLINE", "Our City, Our Responsibility")
    line: str = os.getenv(
        "APP_LINE",
        "We don't just solve problems. We build civilised citizens.",
    )
    short: str = os.getenv("APP_SHORT", "OCOR")
    logo: str = os.getenv("APP_LOGO", "/ocor-logo.jpg")
    icon: str = os.getenv("APP_ICON", "/icon.svg")
    code_prefix: str = os.getenv("APP_CODE_PREFIX", "OCOR")
    support_email: str = os.getenv("SUPPORT_EMAIL", "hello@ocor.city")
    hashtags: list[str] = _parse_hashtags(
        os.getenv("APP_HASHTAGS", "#OCOR,#OurCityOurResponsibility")
    )

    @property
    def full_name(self) -> str:
        return f"{self.name} — {self.tagline}"

    @property
    def supportEmail(self) -> str:
        return self.support_email


brand = Brand()
