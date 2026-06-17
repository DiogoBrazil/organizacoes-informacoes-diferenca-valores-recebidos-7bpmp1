from pydantic import BaseModel, Field, field_validator


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=180)
    senha: str

    @field_validator("email")
    @classmethod
    def validar_email(cls, value: str) -> str:
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("Informe um e-mail válido.")
        return value.lower()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
