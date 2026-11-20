(module
 (type $0 (func (result i32)))
 (type $1 (func))
 (type $2 (func (param f32 f32 i32 f32 f32 f32 f32 f32 f32 f32) (result i32)))
 (type $3 (func (param f32) (result i32)))
 (type $4 (func (param f32 f32 f32 f32 f32 f32 i32 i32) (result i32)))
 (type $5 (func (param f32 f32 i32 f32 f32) (result i32)))
 (type $6 (func (param f32 f32 f32 f32)))
 (type $7 (func (param i32)))
 (type $8 (func (param f32 f32)))
 (type $9 (func (param i32 f32 f32) (result i32)))
 (global $assembly/arena/BYTES_PER_PARTICLE i32 (i32.const 49))
 (global $assembly/arena/PARTICLES_WORK_SIZE i32 (i32.const 940800))
 (global $assembly/arena/SCRATCH_SIZE i32 (i32.const 22528))
 (global $assembly/arena/TOTAL_ARENA_SIZE i32 (i32.const 963328))
 (global $assembly/arena/PARAM_IN_PTR i32 (i32.const 1024))
 (global $assembly/arena/PARAM_OUT_PTR i32 (i32.const 3072))
 (global $assembly/arena/SCRATCH_WORK_PTR i32 (i32.const 5120))
 (global $assembly/arena/EMITTER_WORK_PTR i32 (i32.const 21504))
 (global $assembly/arena/PARTICLES_WORK_PTR i32 (i32.const 23552))
 (global $assembly/arena/Arena.current (mut i32) (i32.const 0))
 (global $assembly/confetti/capacity (mut i32) (i32.const 0))
 (global $assembly/confetti/activeCount (mut i32) (i32.const 0))
 (global $assembly/confetti/overwriteCursor (mut i32) (i32.const 0))
 (global $assembly/confetti/initialized (mut i32) (i32.const 0))
 (global $assembly/confetti/worldHeight (mut f32) (f32.const 720))
 (global $assembly/confetti/gravity (mut f32) (f32.const 980))
 (global $assembly/confetti/drag (mut f32) (f32.const 1.649999976158142))
 (global $assembly/confetti/wind (mut f32) (f32.const 0))
 (global $assembly/confetti/turbulence (mut f32) (f32.const 180))
 (global $assembly/confetti/totalSpawned (mut i32) (i32.const 0))
 (global $assembly/confetti/totalRecycled (mut i32) (i32.const 0))
 (global $assembly/confetti/rngState (mut i32) (i32.const -1640531527))
 (memory $0 15 15)
 (data $1 (i32.const 964358) "\f0?t\85\15\d3\b0\d9\ef?\0f\89\f9lX\b5\ef?Q[\12\d0\01\93\ef?{Q}<\b8r\ef?\aa\b9h1\87T\ef?8bunz8\ef?\e1\de\1f\f5\9d\1e\ef?\15\b71\n\fe\06\ef?\cb\a9:7\a7\f1\ee?\"4\12L\a6\de\ee?-\89a`\08\ce\ee?\'*6\d5\da\bf\ee?\82O\9dV+\b4\ee?)TH\dd\07\ab\ee?\85U:\b0~\a4\ee?\cd;\7ff\9e\a0\ee?t_\ec\e8u\9f\ee?\87\01\ebs\14\a1\ee?\13\ceL\99\89\a5\ee?\db\a0*B\e5\ac\ee?\e5\c5\cd\b07\b7\ee?\90\f0\a3\82\91\c4\ee?]%>\b2\03\d5\ee?\ad\d3Z\99\9f\e8\ee?G^\fb\f2v\ff\ee?\9cR\85\dd\9b\19\ef?i\90\ef\dc 7\ef?\87\a4\fb\dc\18X\ef?_\9b{3\97|\ef?\da\90\a4\a2\af\a4\ef?@En[v\d0\ef?")
 (export "init" (func $assembly/confetti/init))
 (export "resize" (func $assembly/confetti/resize))
 (export "seedRng" (func $assembly/confetti/seedRng))
 (export "setPhysics" (func $assembly/confetti/setPhysics))
 (export "spawnBurst" (func $assembly/confetti/spawnBurst))
 (export "spawnDualCannons" (func $assembly/confetti/spawnDualCannons))
 (export "spawnParticleExact" (func $assembly/confetti/spawnParticleExact))
 (export "computeColorHistogram" (func $assembly/confetti/computeColorHistogram))
 (export "step" (func $assembly/confetti/step))
 (export "clear" (func $assembly/confetti/clear))
 (export "getActiveCount" (func $assembly/confetti/getActiveCount))
 (export "getCapacity" (func $assembly/confetti/getCapacity))
 (export "getMaxCapacity" (func $assembly/confetti/getMaxCapacity))
 (export "getBytesPerParticle" (func $assembly/confetti/getBytesPerParticle))
 (export "getArenaStart" (func $assembly/confetti/getArenaStart))
 (export "getArenaBytes" (func $assembly/confetti/getArenaBytes))
 (export "getMemoryPages" (func $assembly/confetti/getMemoryPages))
 (export "getMemoryBytes" (func $assembly/confetti/getMemoryBytes))
 (export "getHeapBase" (func $assembly/confetti/getHeapBase))
 (export "getPostInitGrowCount" (func $assembly/confetti/getPostInitGrowCount))
 (export "getTotalSpawned" (func $assembly/confetti/getTotalSpawned))
 (export "getTotalRecycled" (func $assembly/confetti/getTotalRecycled))
 (export "getArenaCurrent" (func $assembly/confetti/getArenaCurrent))
 (export "getXPtr" (func $assembly/confetti/getXPtr))
 (export "getYPtr" (func $assembly/confetti/getYPtr))
 (export "getVxPtr" (func $assembly/confetti/getVxPtr))
 (export "getVyPtr" (func $assembly/confetti/getVyPtr))
 (export "getRotPtr" (func $assembly/confetti/getRotPtr))
 (export "getTiltPtr" (func $assembly/confetti/getTiltPtr))
 (export "getSizePtr" (func $assembly/confetti/getSizePtr))
 (export "getRemLifePtr" (func $assembly/confetti/getRemLifePtr))
 (export "getMetaPtr" (func $assembly/confetti/getMetaPtr))
 (export "BYTES_PER_PARTICLE" (global $assembly/arena/BYTES_PER_PARTICLE))
 (export "EMITTER_WORK_PTR" (global $assembly/arena/EMITTER_WORK_PTR))
 (export "PARAM_IN_PTR" (global $assembly/arena/PARAM_IN_PTR))
 (export "PARAM_OUT_PTR" (global $assembly/arena/PARAM_OUT_PTR))
 (export "PARTICLES_WORK_PTR" (global $assembly/arena/PARTICLES_WORK_PTR))
 (export "PARTICLES_WORK_SIZE" (global $assembly/arena/PARTICLES_WORK_SIZE))
 (export "SCRATCH_SIZE" (global $assembly/arena/SCRATCH_SIZE))
 (export "SCRATCH_WORK_PTR" (global $assembly/arena/SCRATCH_WORK_PTR))
 (export "TOTAL_ARENA_SIZE" (global $assembly/arena/TOTAL_ARENA_SIZE))
 (export "secure_wipe" (func $assembly/arena/secure_wipe))
 (export "memory" (memory $0))
 (start $~start)
 (func $assembly/confetti/spawnBurst (param $0 f32) (param $1 f32) (param $2 i32) (param $3 f32) (param $4 f32) (param $5 f32) (param $6 f32) (param $7 f32) (param $8 f32) (param $9 f32) (result i32)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 f32)
  (local $16 f32)
  (local $17 f32)
  (local $18 f32)
  (local $19 f32)
  (local $20 i32)
  global.get $assembly/confetti/initialized
  i32.eqz
  local.get $2
  i32.const 0
  i32.le_s
  i32.or
  if
   i32.const 0
   return
  end
  local.get $4
  f32.const 0.5
  f32.mul
  local.set $15
  local.get $7
  local.get $6
  f32.const 1
  local.get $6
  f32.const 1
  f32.gt
  select
  local.tee $4
  local.get $4
  local.get $7
  f32.le
  select
  local.set $16
  local.get $9
  local.get $8
  f32.const 0.05000000074505806
  local.get $8
  f32.const 0.05000000074505806
  f32.gt
  select
  local.tee $6
  local.get $6
  local.get $9
  f32.le
  select
  local.set $8
  loop $for-loop|0
   local.get $2
   local.get $12
   i32.gt_s
   if
    global.get $assembly/confetti/rngState
    local.tee $10
    i32.const 13
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    i32.const 17
    i32.shr_u
    local.get $10
    i32.xor
    local.tee $10
    i32.const 5
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    global.set $assembly/confetti/rngState
    local.get $5
    local.get $15
    f32.neg
    local.tee $7
    local.get $10
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    local.get $15
    local.get $7
    f32.sub
    f32.mul
    f32.add
    f32.add
    local.set $9
    global.get $assembly/confetti/rngState
    local.tee $10
    i32.const 13
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    i32.const 17
    i32.shr_u
    local.get $10
    i32.xor
    local.tee $10
    i32.const 5
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    global.set $assembly/confetti/rngState
    local.get $3
    local.get $10
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 0.8999999761581421
    f32.mul
    f32.const 0.3499999940395355
    f32.add
    f32.mul
    local.set $7
    global.get $assembly/confetti/rngState
    local.tee $10
    i32.const 13
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    i32.const 17
    i32.shr_u
    local.get $10
    i32.xor
    local.tee $10
    i32.const 5
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    global.set $assembly/confetti/rngState
    local.get $4
    local.get $10
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    local.get $16
    local.get $4
    f32.sub
    f32.mul
    f32.add
    local.set $17
    global.get $assembly/confetti/rngState
    local.tee $10
    i32.const 13
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    i32.const 17
    i32.shr_u
    local.get $10
    i32.xor
    local.tee $10
    i32.const 5
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    global.set $assembly/confetti/rngState
    local.get $6
    local.get $10
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    local.get $8
    local.get $6
    f32.sub
    f32.mul
    f32.add
    local.set $18
    global.get $assembly/confetti/rngState
    local.tee $10
    i32.const 13
    i32.shl
    local.get $10
    i32.xor
    local.tee $10
    i32.const 17
    i32.shr_u
    local.get $10
    i32.xor
    local.tee $10
    i32.const 5
    i32.shl
    local.get $10
    i32.xor
    local.tee $13
    global.set $assembly/confetti/rngState
    block $assembly/confetti/allocSlot|inlined.0
     global.get $assembly/confetti/activeCount
     global.get $assembly/confetti/capacity
     i32.lt_s
     if
      global.get $assembly/confetti/activeCount
      local.tee $10
      i32.const 1
      i32.add
      global.set $assembly/confetti/activeCount
      br $assembly/confetti/allocSlot|inlined.0
     end
     global.get $assembly/confetti/overwriteCursor
     local.tee $10
     i32.const 1
     i32.add
     global.set $assembly/confetti/overwriteCursor
     global.get $assembly/confetti/overwriteCursor
     global.get $assembly/confetti/capacity
     i32.ge_s
     if
      i32.const 0
      global.set $assembly/confetti/overwriteCursor
     end
     global.get $assembly/confetti/totalRecycled
     i32.const 1
     i32.add
     global.set $assembly/confetti/totalRecycled
    end
    local.get $10
    i32.const 2
    i32.shl
    local.tee $14
    i32.const 23552
    i32.add
    local.get $0
    f32.store
    local.get $14
    i32.const 100352
    i32.add
    local.get $1
    f32.store
    local.get $14
    i32.const 177152
    i32.add
    local.get $9
    f32.const 1.5707963705062866
    f32.add
    local.tee $19
    local.get $19
    f32.const 3.1415927410125732
    f32.add
    f32.const 0.15915493667125702
    f32.mul
    f32.floor
    f32.const 6.2831854820251465
    f32.mul
    f32.sub
    local.tee $19
    f32.const 1.2732394933700562
    f32.mul
    local.get $19
    f32.const 0.40528473258018494
    f32.mul
    local.get $19
    f32.abs
    f32.mul
    f32.sub
    local.tee $19
    local.get $19
    f32.abs
    f32.mul
    local.get $19
    f32.sub
    f32.const 0.22499999403953552
    f32.mul
    local.get $19
    f32.add
    local.get $7
    f32.mul
    f32.store
    local.get $14
    i32.const 253952
    i32.add
    local.get $9
    local.get $9
    f32.const 3.1415927410125732
    f32.add
    f32.const 0.15915493667125702
    f32.mul
    f32.floor
    f32.const 6.2831854820251465
    f32.mul
    f32.sub
    local.tee $9
    f32.const 1.2732394933700562
    f32.mul
    local.get $9
    f32.const 0.40528473258018494
    f32.mul
    local.get $9
    f32.abs
    f32.mul
    f32.sub
    local.tee $9
    local.get $9
    f32.abs
    f32.mul
    local.get $9
    f32.sub
    f32.const 0.22499999403953552
    f32.mul
    local.get $9
    f32.add
    local.get $7
    f32.mul
    f32.store
    global.get $assembly/confetti/rngState
    local.tee $20
    i32.const 13
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    i32.const 17
    i32.shr_u
    local.get $20
    i32.xor
    local.tee $20
    i32.const 5
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    global.set $assembly/confetti/rngState
    local.get $14
    i32.const 330752
    i32.add
    local.get $20
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 6.2831854820251465
    f32.mul
    f32.const 0
    f32.add
    f32.store
    global.get $assembly/confetti/rngState
    local.tee $20
    i32.const 13
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    i32.const 17
    i32.shr_u
    local.get $20
    i32.xor
    local.tee $20
    i32.const 5
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    global.set $assembly/confetti/rngState
    local.get $14
    i32.const 407552
    i32.add
    local.get $20
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 22
    f32.mul
    f32.const -11
    f32.add
    f32.store
    global.get $assembly/confetti/rngState
    local.tee $20
    i32.const 13
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    i32.const 17
    i32.shr_u
    local.get $20
    i32.xor
    local.tee $20
    i32.const 5
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    global.set $assembly/confetti/rngState
    local.get $14
    i32.const 484352
    i32.add
    local.get $20
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 6.2831854820251465
    f32.mul
    f32.const 0
    f32.add
    f32.store
    global.get $assembly/confetti/rngState
    local.tee $20
    i32.const 13
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    i32.const 17
    i32.shr_u
    local.get $20
    i32.xor
    local.tee $20
    i32.const 5
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    global.set $assembly/confetti/rngState
    local.get $14
    i32.const 561152
    i32.add
    local.get $20
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 10
    f32.mul
    f32.const 6
    f32.add
    f32.store
    global.get $assembly/confetti/rngState
    local.tee $20
    i32.const 13
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    i32.const 17
    i32.shr_u
    local.get $20
    i32.xor
    local.tee $20
    i32.const 5
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    global.set $assembly/confetti/rngState
    local.get $14
    i32.const 637952
    i32.add
    local.get $20
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 6.2831854820251465
    f32.mul
    f32.const 0
    f32.add
    f32.store
    global.get $assembly/confetti/rngState
    local.tee $20
    i32.const 13
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    i32.const 17
    i32.shr_u
    local.get $20
    i32.xor
    local.tee $20
    i32.const 5
    i32.shl
    local.get $20
    i32.xor
    local.tee $20
    global.set $assembly/confetti/rngState
    local.get $14
    i32.const 714752
    i32.add
    local.get $20
    i32.const 8
    i32.shr_u
    f32.convert_i32_u
    f32.const 5.9604644775390625e-08
    f32.mul
    f32.const 5.5
    f32.mul
    f32.const 4
    f32.add
    f32.store
    local.get $14
    i32.const 791552
    i32.add
    local.get $17
    f32.store
    local.get $14
    i32.const 868352
    i32.add
    local.get $18
    f32.store
    local.get $10
    i32.const 945152
    i32.add
    local.get $13
    i32.const 12
    i32.rem_u
    local.get $13
    i32.const 8
    i32.shr_u
    i32.const 3
    i32.and
    i32.const 4
    i32.shl
    i32.or
    i32.store8
    local.get $11
    i32.const 1
    i32.add
    local.set $11
    local.get $12
    i32.const 1
    i32.add
    local.set $12
    br $for-loop|0
   end
  end
  global.get $assembly/confetti/totalSpawned
  local.get $11
  i32.add
  global.set $assembly/confetti/totalSpawned
  local.get $11
 )
 (func $~start
  i32.const 5120
  global.set $assembly/arena/Arena.current
  i32.const 19200
  global.set $assembly/confetti/capacity
 )
 (func $assembly/confetti/step (param $0 f32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 v128)
  (local $4 f64)
  (local $5 i64)
  (local $6 v128)
  (local $7 v128)
  (local $8 f32)
  (local $9 f32)
  (local $10 f32)
  (local $11 v128)
  (local $12 f32)
  (local $13 v128)
  (local $14 f32)
  (local $15 v128)
  (local $16 v128)
  (local $17 v128)
  (local $18 v128)
  (local $19 v128)
  (local $20 v128)
  (local $21 f32)
  (local $22 f32)
  (local $23 f32)
  (local $24 f32)
  (local $25 f32)
  (local $26 i32)
  (local $27 f64)
  (local $28 f32)
  (local $29 i32)
  (local $30 i32)
  (local $31 i32)
  (local $32 i32)
  (local $33 i32)
  (local $34 i32)
  (local $35 i32)
  (local $36 i32)
  (local $37 v128)
  (local $38 f32)
  global.get $assembly/confetti/initialized
  i32.eqz
  local.get $0
  f32.const 0
  f32.le
  i32.or
  local.get $0
  local.get $0
  f32.ne
  i32.or
  if
   global.get $assembly/confetti/activeCount
   return
  end
  global.get $assembly/confetti/worldHeight
  f32.const 90
  f32.add
  f32.const 1e9
  global.get $assembly/confetti/worldHeight
  f32.const 0
  f32.gt
  select
  local.set $9
  local.get $0
  f32x4.splat
  local.set $3
  global.get $assembly/confetti/drag
  f32.neg
  local.get $0
  f32.mul
  local.tee $8
  f64.promote_f32
  local.set $4
  block $~lib/util/math/expf_lut|inlined.0 (result f32)
   local.get $8
   i32.reinterpret_f32
   local.tee $1
   i32.const 20
   i32.shr_u
   i32.const 2047
   i32.and
   local.tee $26
   i32.const 1067
   i32.ge_u
   if
    f32.const 0
    local.get $1
    i32.const -8388608
    i32.eq
    br_if $~lib/util/math/expf_lut|inlined.0
    drop
    local.get $8
    local.get $8
    f32.add
    local.get $26
    i32.const 2040
    i32.ge_u
    br_if $~lib/util/math/expf_lut|inlined.0
    drop
    local.get $8
    f32.const 1701411834604692317316873e14
    f32.mul
    local.get $8
    f32.const 88.72283172607422
    f32.gt
    br_if $~lib/util/math/expf_lut|inlined.0
    drop
    f32.const 0
    local.get $8
    f32.const -103.97207641601562
    f32.lt
    br_if $~lib/util/math/expf_lut|inlined.0
    drop
   end
   local.get $4
   f64.const 46.16624130844683
   f64.mul
   local.tee $4
   f64.const 6755399441055744
   f64.add
   local.tee $27
   i64.reinterpret_f64
   local.set $5
   local.get $4
   local.get $27
   f64.const -6755399441055744
   f64.add
   f64.sub
   local.tee $4
   f64.const 0.021660849396613134
   f64.mul
   f64.const 1
   f64.add
   local.get $4
   f64.const 1.6938359250920212e-06
   f64.mul
   f64.const 2.3459809789509004e-04
   f64.add
   local.get $4
   local.get $4
   f64.mul
   f64.mul
   f64.add
   local.get $5
   i32.wrap_i64
   i32.const 31
   i32.and
   i32.const 3
   i32.shl
   i32.const 964352
   i32.add
   i64.load
   local.get $5
   i64.const 47
   i64.shl
   i64.add
   f64.reinterpret_i64
   f64.mul
   f32.demote_f64
  end
  local.tee $28
  f32x4.splat
  local.set $6
  global.get $assembly/confetti/gravity
  local.get $0
  f32.mul
  local.tee $10
  f32x4.splat
  local.set $11
  global.get $assembly/confetti/wind
  local.get $0
  f32.mul
  local.tee $12
  f32x4.splat
  local.set $13
  global.get $assembly/confetti/turbulence
  local.get $0
  f32.mul
  local.tee $14
  f32x4.splat
  local.set $15
  global.get $assembly/confetti/activeCount
  local.tee $29
  i32.const -4
  i32.and
  local.set $1
  loop $for-loop|0
   local.get $1
   local.get $2
   i32.gt_s
   if
    local.get $2
    i32.const 2
    i32.shl
    local.tee $30
    i32.const 868352
    i32.add
    local.tee $31
    v128.load
    local.get $3
    f32x4.sub
    local.set $16
    local.get $30
    i32.const 100352
    i32.add
    local.tee $32
    v128.load
    local.get $30
    i32.const 253952
    i32.add
    local.tee $33
    v128.load
    local.get $6
    f32x4.mul
    local.get $11
    f32x4.add
    local.tee $17
    local.get $3
    f32x4.mul
    f32x4.add
    local.set $18
    local.get $30
    i32.const 330752
    i32.add
    local.tee $34
    v128.load
    local.get $30
    i32.const 407552
    i32.add
    v128.load
    local.get $3
    f32x4.mul
    f32x4.add
    local.set $19
    local.get $30
    i32.const 484352
    i32.add
    local.tee $35
    v128.load
    local.get $30
    i32.const 561152
    i32.add
    v128.load
    local.get $3
    f32x4.mul
    f32x4.add
    local.set $20
    local.get $30
    i32.const 23552
    i32.add
    local.tee $26
    local.get $26
    v128.load
    local.get $30
    i32.const 177152
    i32.add
    local.tee $36
    v128.load
    local.get $6
    f32x4.mul
    local.get $13
    v128.const i32x4 0x3e666666 0x3e666666 0x3e666666 0x3e666666
    v128.const i32x4 0x3fa2f983 0x3fa2f983 0x3fa2f983 0x3fa2f983
    local.get $30
    i32.const 637952
    i32.add
    local.tee $26
    v128.load
    local.get $30
    i32.const 714752
    i32.add
    v128.load
    local.get $3
    f32x4.mul
    f32x4.add
    local.tee $7
    local.get $7
    v128.const i32x4 0x40490fdb 0x40490fdb 0x40490fdb 0x40490fdb
    f32x4.add
    v128.const i32x4 0x3e22f983 0x3e22f983 0x3e22f983 0x3e22f983
    f32x4.mul
    f32x4.floor
    v128.const i32x4 0x40c90fdb 0x40c90fdb 0x40c90fdb 0x40c90fdb
    f32x4.mul
    f32x4.sub
    local.tee $37
    f32x4.mul
    v128.const i32x4 0x3ecf817b 0x3ecf817b 0x3ecf817b 0x3ecf817b
    local.get $37
    local.get $37
    f32x4.abs
    f32x4.mul
    f32x4.mul
    f32x4.sub
    local.tee $37
    local.get $37
    f32x4.abs
    f32x4.mul
    local.get $37
    f32x4.sub
    f32x4.mul
    local.get $37
    f32x4.add
    local.get $15
    f32x4.mul
    f32x4.add
    f32x4.add
    local.tee $37
    local.get $3
    f32x4.mul
    f32x4.add
    v128.store
    local.get $32
    local.get $18
    v128.store
    local.get $36
    local.get $37
    v128.store
    local.get $33
    local.get $17
    v128.store
    local.get $34
    local.get $19
    v128.store
    local.get $35
    local.get $20
    v128.store
    local.get $26
    local.get $7
    v128.store
    local.get $31
    local.get $16
    v128.store
    local.get $2
    i32.const 4
    i32.add
    local.set $2
    br $for-loop|0
   end
  end
  loop $for-loop|1
   local.get $1
   local.get $29
   i32.lt_s
   if
    local.get $1
    i32.const 2
    i32.shl
    local.tee $2
    i32.const 868352
    i32.add
    local.tee $26
    f32.load
    local.get $0
    f32.sub
    local.set $21
    local.get $2
    i32.const 100352
    i32.add
    local.tee $30
    f32.load
    local.get $2
    i32.const 253952
    i32.add
    local.tee $31
    f32.load
    local.get $28
    f32.mul
    local.get $10
    f32.add
    local.tee $22
    local.get $0
    f32.mul
    f32.add
    local.set $23
    local.get $2
    i32.const 330752
    i32.add
    local.tee $32
    f32.load
    local.get $2
    i32.const 407552
    i32.add
    f32.load
    local.get $0
    f32.mul
    f32.add
    local.set $24
    local.get $2
    i32.const 484352
    i32.add
    local.tee $33
    f32.load
    local.get $2
    i32.const 561152
    i32.add
    f32.load
    local.get $0
    f32.mul
    f32.add
    local.set $25
    local.get $2
    i32.const 23552
    i32.add
    local.tee $34
    local.get $34
    f32.load
    local.get $2
    i32.const 177152
    i32.add
    local.tee $34
    f32.load
    local.get $28
    f32.mul
    local.get $12
    f32.add
    local.get $2
    i32.const 637952
    i32.add
    local.tee $35
    f32.load
    local.get $2
    i32.const 714752
    i32.add
    f32.load
    local.get $0
    f32.mul
    f32.add
    local.tee $8
    local.get $8
    f32.const 3.1415927410125732
    f32.add
    f32.const 0.15915493667125702
    f32.mul
    f32.floor
    f32.const 6.2831854820251465
    f32.mul
    f32.sub
    local.tee $38
    f32.const 1.2732394933700562
    f32.mul
    local.get $38
    f32.const 0.40528473258018494
    f32.mul
    local.get $38
    f32.abs
    f32.mul
    f32.sub
    local.tee $38
    local.get $38
    f32.abs
    f32.mul
    local.get $38
    f32.sub
    f32.const 0.22499999403953552
    f32.mul
    local.get $38
    f32.add
    local.get $14
    f32.mul
    f32.add
    local.tee $38
    local.get $0
    f32.mul
    f32.add
    f32.store
    local.get $30
    local.get $23
    f32.store
    local.get $34
    local.get $38
    f32.store
    local.get $31
    local.get $22
    f32.store
    local.get $32
    local.get $24
    f32.store
    local.get $33
    local.get $25
    f32.store
    local.get $35
    local.get $8
    f32.store
    local.get $26
    local.get $21
    f32.store
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|1
   end
  end
  i32.const 0
  local.set $2
  loop $while-continue|2
   local.get $2
   global.get $assembly/confetti/activeCount
   i32.lt_s
   if
    local.get $2
    i32.const 2
    i32.shl
    local.tee $1
    i32.const 868352
    i32.add
    f32.load
    f32.const 0
    f32.le
    if (result i32)
     i32.const 1
    else
     local.get $1
     i32.const 100352
     i32.add
     f32.load
     local.get $9
     f32.gt
    end
    if
     global.get $assembly/confetti/activeCount
     i32.const 1
     i32.sub
     local.tee $1
     local.get $2
     i32.ne
     if
      local.get $2
      i32.const 2
      i32.shl
      local.tee $26
      i32.const 23552
      i32.add
      local.get $1
      i32.const 2
      i32.shl
      local.tee $29
      i32.const 23552
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 100352
      i32.add
      local.get $29
      i32.const 100352
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 177152
      i32.add
      local.get $29
      i32.const 177152
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 253952
      i32.add
      local.get $29
      i32.const 253952
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 330752
      i32.add
      local.get $29
      i32.const 330752
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 407552
      i32.add
      local.get $29
      i32.const 407552
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 484352
      i32.add
      local.get $29
      i32.const 484352
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 561152
      i32.add
      local.get $29
      i32.const 561152
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 637952
      i32.add
      local.get $29
      i32.const 637952
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 714752
      i32.add
      local.get $29
      i32.const 714752
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 791552
      i32.add
      local.get $29
      i32.const 791552
      i32.add
      f32.load
      f32.store
      local.get $26
      i32.const 868352
      i32.add
      local.get $29
      i32.const 868352
      i32.add
      f32.load
      f32.store
      local.get $2
      i32.const 945152
      i32.add
      local.get $1
      i32.const 945152
      i32.add
      i32.load8_u
      i32.store8
     end
     local.get $1
     global.set $assembly/confetti/activeCount
     br $while-continue|2
    end
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $while-continue|2
   end
  end
  global.get $assembly/confetti/activeCount
 )
 (func $assembly/confetti/spawnParticleExact (param $0 f32) (param $1 f32) (param $2 f32) (param $3 f32) (param $4 f32) (param $5 f32) (param $6 i32) (param $7 i32) (result i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  global.get $assembly/confetti/initialized
  i32.eqz
  if
   i32.const -1
   return
  end
  block $assembly/confetti/allocSlot|inlined.1
   global.get $assembly/confetti/activeCount
   global.get $assembly/confetti/capacity
   i32.lt_s
   if
    global.get $assembly/confetti/activeCount
    local.tee $9
    i32.const 1
    i32.add
    global.set $assembly/confetti/activeCount
    br $assembly/confetti/allocSlot|inlined.1
   end
   global.get $assembly/confetti/overwriteCursor
   local.tee $9
   i32.const 1
   i32.add
   global.set $assembly/confetti/overwriteCursor
   global.get $assembly/confetti/overwriteCursor
   global.get $assembly/confetti/capacity
   i32.ge_s
   if
    i32.const 0
    global.set $assembly/confetti/overwriteCursor
   end
   global.get $assembly/confetti/totalRecycled
   i32.const 1
   i32.add
   global.set $assembly/confetti/totalRecycled
  end
  local.get $9
  i32.const 2
  i32.shl
  local.tee $8
  i32.const 23552
  i32.add
  local.get $0
  f32.store
  local.get $8
  i32.const 100352
  i32.add
  local.get $1
  f32.store
  local.get $8
  i32.const 177152
  i32.add
  local.get $2
  f32.store
  local.get $8
  i32.const 253952
  i32.add
  local.get $3
  f32.store
  global.get $assembly/confetti/rngState
  local.tee $10
  i32.const 13
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  i32.const 17
  i32.shr_u
  local.get $10
  i32.xor
  local.tee $10
  i32.const 5
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  global.set $assembly/confetti/rngState
  local.get $8
  i32.const 330752
  i32.add
  local.get $10
  i32.const 8
  i32.shr_u
  f32.convert_i32_u
  f32.const 5.9604644775390625e-08
  f32.mul
  f32.const 6.2831854820251465
  f32.mul
  f32.const 0
  f32.add
  f32.store
  global.get $assembly/confetti/rngState
  local.tee $10
  i32.const 13
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  i32.const 17
  i32.shr_u
  local.get $10
  i32.xor
  local.tee $10
  i32.const 5
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  global.set $assembly/confetti/rngState
  local.get $8
  i32.const 407552
  i32.add
  local.get $10
  i32.const 8
  i32.shr_u
  f32.convert_i32_u
  f32.const 5.9604644775390625e-08
  f32.mul
  f32.const 22
  f32.mul
  f32.const -11
  f32.add
  f32.store
  global.get $assembly/confetti/rngState
  local.tee $10
  i32.const 13
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  i32.const 17
  i32.shr_u
  local.get $10
  i32.xor
  local.tee $10
  i32.const 5
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  global.set $assembly/confetti/rngState
  local.get $8
  i32.const 484352
  i32.add
  local.get $10
  i32.const 8
  i32.shr_u
  f32.convert_i32_u
  f32.const 5.9604644775390625e-08
  f32.mul
  f32.const 6.2831854820251465
  f32.mul
  f32.const 0
  f32.add
  f32.store
  global.get $assembly/confetti/rngState
  local.tee $10
  i32.const 13
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  i32.const 17
  i32.shr_u
  local.get $10
  i32.xor
  local.tee $10
  i32.const 5
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  global.set $assembly/confetti/rngState
  local.get $8
  i32.const 561152
  i32.add
  local.get $10
  i32.const 8
  i32.shr_u
  f32.convert_i32_u
  f32.const 5.9604644775390625e-08
  f32.mul
  f32.const 10
  f32.mul
  f32.const 6
  f32.add
  f32.store
  global.get $assembly/confetti/rngState
  local.tee $10
  i32.const 13
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  i32.const 17
  i32.shr_u
  local.get $10
  i32.xor
  local.tee $10
  i32.const 5
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  global.set $assembly/confetti/rngState
  local.get $8
  i32.const 637952
  i32.add
  local.get $10
  i32.const 8
  i32.shr_u
  f32.convert_i32_u
  f32.const 5.9604644775390625e-08
  f32.mul
  f32.const 6.2831854820251465
  f32.mul
  f32.const 0
  f32.add
  f32.store
  global.get $assembly/confetti/rngState
  local.tee $10
  i32.const 13
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  i32.const 17
  i32.shr_u
  local.get $10
  i32.xor
  local.tee $10
  i32.const 5
  i32.shl
  local.get $10
  i32.xor
  local.tee $10
  global.set $assembly/confetti/rngState
  local.get $8
  i32.const 714752
  i32.add
  local.get $10
  i32.const 8
  i32.shr_u
  f32.convert_i32_u
  f32.const 5.9604644775390625e-08
  f32.mul
  f32.const 5.5
  f32.mul
  f32.const 4
  f32.add
  f32.store
  local.get $8
  i32.const 791552
  i32.add
  local.get $4
  f32.store
  local.get $8
  i32.const 868352
  i32.add
  local.get $5
  f32.store
  local.get $9
  i32.const 945152
  i32.add
  local.get $6
  i32.const 15
  i32.and
  local.get $7
  i32.const 3
  i32.and
  i32.const 4
  i32.shl
  i32.or
  i32.store8
  global.get $assembly/confetti/totalSpawned
  i32.const 1
  i32.add
  global.set $assembly/confetti/totalSpawned
  local.get $9
 )
 (func $assembly/confetti/spawnDualCannons (param $0 f32) (param $1 f32) (param $2 i32) (param $3 f32) (param $4 f32) (result i32)
  local.get $0
  f32.const 0.05999999865889549
  f32.mul
  local.get $1
  f32.const 0.8799999952316284
  f32.mul
  local.tee $1
  local.get $2
  local.get $3
  local.get $4
  f32.const -1
  f32.const 5
  f32.const 11
  f32.const 2.4000000953674316
  f32.const 4.5
  call $assembly/confetti/spawnBurst
  local.get $0
  f32.const 0.9399999976158142
  f32.mul
  local.get $1
  local.get $2
  local.get $3
  local.get $4
  f32.const -2.1415927410125732
  f32.const 5
  f32.const 11
  f32.const 2.4000000953674316
  f32.const 4.5
  call $assembly/confetti/spawnBurst
  i32.add
 )
 (func $assembly/confetti/setPhysics (param $0 f32) (param $1 f32) (param $2 f32) (param $3 f32)
  local.get $0
  global.set $assembly/confetti/gravity
  local.get $1
  f32.const 0
  local.get $1
  f32.const 0
  f32.ge
  select
  global.set $assembly/confetti/drag
  local.get $2
  global.set $assembly/confetti/wind
  local.get $3
  f32.const 0
  local.get $3
  f32.const 0
  f32.ge
  select
  global.set $assembly/confetti/turbulence
 )
 (func $assembly/confetti/seedRng (param $0 i32)
  local.get $0
  i32.const -1640531527
  local.get $0
  select
  global.set $assembly/confetti/rngState
 )
 (func $assembly/confetti/resize (param $0 f32) (param $1 f32)
  local.get $1
  f32.const 0
  f32.gt
  if
   local.get $1
   global.set $assembly/confetti/worldHeight
  end
 )
 (func $assembly/confetti/init (param $0 i32) (param $1 f32) (param $2 f32) (result i32)
  i32.const 64
  local.get $0
  local.get $0
  i32.const 64
  i32.lt_s
  select
  local.tee $0
  i32.const 19200
  i32.gt_s
  if
   i32.const 19200
   local.set $0
  end
  local.get $0
  global.set $assembly/confetti/capacity
  i32.const 0
  global.set $assembly/confetti/activeCount
  i32.const 0
  global.set $assembly/confetti/overwriteCursor
  local.get $2
  f32.const 720
  local.get $2
  f32.const 0
  f32.gt
  select
  global.set $assembly/confetti/worldHeight
  i32.const 5120
  global.set $assembly/arena/Arena.current
  i32.const 0
  global.set $assembly/confetti/totalSpawned
  i32.const 0
  global.set $assembly/confetti/totalRecycled
  i32.const 1
  global.set $assembly/confetti/initialized
  local.get $0
 )
 (func $assembly/confetti/getYPtr (result i32)
  i32.const 100352
 )
 (func $assembly/confetti/getXPtr (result i32)
  i32.const 23552
 )
 (func $assembly/confetti/getVyPtr (result i32)
  i32.const 253952
 )
 (func $assembly/confetti/getVxPtr (result i32)
  i32.const 177152
 )
 (func $assembly/confetti/getTotalSpawned (result i32)
  global.get $assembly/confetti/totalSpawned
 )
 (func $assembly/confetti/getTotalRecycled (result i32)
  global.get $assembly/confetti/totalRecycled
 )
 (func $assembly/confetti/getTiltPtr (result i32)
  i32.const 484352
 )
 (func $assembly/confetti/getSizePtr (result i32)
  i32.const 791552
 )
 (func $assembly/confetti/getRotPtr (result i32)
  i32.const 330752
 )
 (func $assembly/confetti/getRemLifePtr (result i32)
  i32.const 868352
 )
 (func $assembly/confetti/getPostInitGrowCount (result i32)
  i32.const 0
 )
 (func $assembly/confetti/getMetaPtr (result i32)
  i32.const 945152
 )
 (func $assembly/confetti/getMemoryPages (result i32)
  memory.size
 )
 (func $assembly/confetti/getMemoryBytes (result i32)
  memory.size
  i32.const 16
  i32.shl
 )
 (func $assembly/confetti/getMaxCapacity (result i32)
  i32.const 19200
 )
 (func $assembly/confetti/getHeapBase (result i32)
  i32.const 964608
 )
 (func $assembly/confetti/getCapacity (result i32)
  global.get $assembly/confetti/capacity
 )
 (func $assembly/confetti/getBytesPerParticle (result i32)
  i32.const 49
 )
 (func $assembly/confetti/getArenaStart (result i32)
  i32.const 1024
 )
 (func $assembly/confetti/getArenaCurrent (result i32)
  global.get $assembly/arena/Arena.current
 )
 (func $assembly/confetti/getArenaBytes (result i32)
  i32.const 963328
 )
 (func $assembly/confetti/getActiveCount (result i32)
  global.get $assembly/confetti/activeCount
 )
 (func $assembly/confetti/computeColorHistogram (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  global.get $assembly/arena/Arena.current
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $0
  i32.const 48
  i32.add
  local.tee $3
  i32.const 21504
  i32.gt_u
  if
   unreachable
  end
  global.get $assembly/arena/Arena.current
  local.get $3
  global.set $assembly/arena/Arena.current
  local.get $0
  i32.const 0
  i32.const 48
  memory.fill
  global.get $assembly/confetti/activeCount
  local.set $4
  loop $for-loop|0
   local.get $1
   local.get $4
   i32.lt_s
   if
    local.get $0
    local.get $1
    i32.const 945152
    i32.add
    i32.load8_u
    i32.const 15
    i32.and
    i32.const 12
    i32.rem_u
    i32.const 2
    i32.shl
    i32.add
    local.tee $3
    local.get $3
    i32.load
    i32.const 1
    i32.add
    i32.store
    local.get $1
    i32.const 1
    i32.add
    local.set $1
    br $for-loop|0
   end
  end
  i32.const 3072
  local.get $0
  i32.const 48
  memory.copy
  global.set $assembly/arena/Arena.current
  i32.const 12
 )
 (func $assembly/confetti/clear
  i32.const 0
  global.set $assembly/confetti/activeCount
  i32.const 0
  global.set $assembly/confetti/overwriteCursor
 )
 (func $assembly/arena/secure_wipe
  i32.const 1024
  i32.const 0
  i32.const 963328
  memory.fill
  i32.const 5120
  global.set $assembly/arena/Arena.current
 )
)
