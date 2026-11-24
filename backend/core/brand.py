"""Central brand configuration. Override via env vars to rebrand."""
import os


class Brand:
    name: str = os.getenv("APP_NAME", "Better Urban")
    tagline: str = os.getenv("APP_TAGLINE", "Better Together")
    line: str = os.getenv("APP_LINE", "We don't just solve problems. We build civilised citizens.")
    short: str = os.getenv("APP_SHORT", "BU")
    logo: str = os.getenv("APP_LOGO", "/icon-192.png")
    support_email: str = os.getenv("SUPPORT_EMAIL", "hello@betterurban.app")


brand = Brand()
