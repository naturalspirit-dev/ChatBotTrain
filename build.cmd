
cd %~dp0/..
for /d /r . %d in (bin) do @if exist "%d" rd /s/q "%d"
for /d /r . %d in (obj) do @if exist "%d" rd /s/q "%d"

../magic.data.common/build.cmd
../magic.endpoint/build.cmd
../magic.http/build.cmd
../magic.io/build.cmd
../magic.lambda/build.cmd
../magic.lambda.auth/build.cmd
../magic.lambda.config/build.cmd
../magic.lambda.crypto/build.cmd
../magic.lambda.http/build.cmd
../magic.lambda.hyperlambda/build.cmd
../magic.lambda.io/build.cmd
../magic.lambda.json/build.cmd
../magic.lambda.logging/build.cmd
../magic.lambda.math/build.cmd
../magic.lambda.mssql/build.cmd
../magic.lambda.mysql/build.cmd
../magic.lambda.scheduler/build.cmd
../magic.lambda.slots/build.cmd
../magic.lambda.strings/build.cmd
../magic.lambda.validators/build.cmd
../magic.library/build.cmd
../magic.node/build.cmd
../magic.signals/build.cmd
