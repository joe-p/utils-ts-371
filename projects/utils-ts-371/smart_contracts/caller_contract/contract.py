from algopy import Application, ARC4Contract
from algopy.arc4 import abi_call, abimethod


class CalledContract(ARC4Contract):
    @abimethod
    def fail(self) -> None:
        assert False, "custom error message"

class CallerContract(ARC4Contract):
    @abimethod
    def call(self, app: Application) -> None:
        abi_call(CalledContract.fail, app_id=app.id, fee=0)
