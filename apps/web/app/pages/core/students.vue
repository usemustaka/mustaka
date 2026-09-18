<script setup lang="ts">
import { h } from 'vue'
import type { DropdownMenuItem, SelectItem, TableColumn } from '@nuxt/ui'
import { NullContent, UBadge, UCheckbox, UInput, UUser, DataTableHeader } from '#components'
import type { FindManyArgs, ModelResult } from '@mustaka/db'
import type { SchemaType } from '@mustaka/db/zenstack/schema'

const { client } = useDbClient()
const toast = useToast()
const authClient = useAuthClient()

type Student = ModelResult<SchemaType, 'Student', { include: { profile: true } }>
type StudentArgs = FindManyArgs<SchemaType, 'Student'>

const q = useRouteFilter<{
  page: number
  limit: number
  where?: StudentArgs['where']
  orderBy?: StudentArgs['orderBy']
}>('q', { page: 1, limit: 50 })

const columnVisibility = ref<Record<string, boolean>>({})
const columnPinning = ref({ left: ['select'], right: [] })

const activeMemberRole = authClient?.useActiveMemberRole()
const isAdminOrOwner = computed(() => {
  const role = activeMemberRole?.value?.data?.role
  return role === 'owner' || role === 'admin'
})

const { data: rows, asyncStatus, refresh } = client.student.useFindMany(() => ({
  include: { profile: true },
  where: q.value.where,
  orderBy: q.value.orderBy ?? [{ createdAt: 'desc' }],
  take: q.value.limit,
  skip: (q.value.page - 1) * q.value.limit
}))
const { data: total } = client.student.useCount(() => ({ where: q.value.where }))

const { mutateAsync: deleteStudent } = client.student.useDelete()
const { mutateAsync: updateStudent } = client.student.useUpdate()
const { mutateAsync: updatePerson } = client.person.useUpdate()

// ── Selection ──────────────────────────────────────────────────────────────
const rowSelection = ref<Record<string, boolean>>({})

const selectedRows = computed<Student[]>(() =>
  (rows.value ?? []).filter(row => !!rowSelection.value[row.id])
)

async function deleteStudents(ids: string[]) {
  const results = await Promise.allSettled(
    ids.map(id => deleteStudent({ where: { id } }))
  )
  const failed = results.filter(r => r.status === 'rejected').length
  if (failed) {
    toast.add({ description: `${failed} of ${ids.length} deletions failed` })
  } else {
    toast.add({ description: `${ids.length} ${ids.length === 1 ? 'student deleted' : 'students deleted'}` })
  }
}

function confirmDelete(ids: string[], onDone?: () => void) {
  useConfirmation({
    title: ids.length === 1 ? 'Delete Student' : 'Delete Students',
    description: ids.length === 1
      ? 'Are you sure you want to permanently delete this student? This action cannot be undone.'
      : `Are you sure you want to permanently delete ${ids.length} students? This action cannot be undone.`,
    color: 'error',
    onConfirm: async () => {
      await deleteStudents(ids)
      onDone?.()
    }
  })
}

const selectionItems = computed<DropdownMenuItem[][]>(() => {
  if (!selectedRows.value.length || !isAdminOrOwner.value) return []
  return [[{
    label: `Delete ${selectedRows.value.length} student(s)`,
    icon: 'i-lucide-trash-2',
    color: 'error',
    onSelect: () => confirmDelete(selectedRows.value.map(s => s.id), () => { rowSelection.value = {} })
  }]]
})

async function updateStudentField(row: Student, field: string, value: unknown) {
  try {
    await updateStudent({
      where: { id: row.id },
      data: { [field]: value === '' ? null : value }
    })
    refresh()
  } catch (error) {
    handleError(error)
  }
}

async function updateProfileField(row: Student, field: string, value: unknown) {
  try {
    await updatePerson({
      where: { id: row.profileId },
      data: { [field]: value === '' ? null : value }
    })
    refresh()
  } catch (error) {
    handleError(error)
  }
}

const statusOptions: SelectItem[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Transferred', value: 'TRANSFERRED' },
  { label: 'Dropped', value: 'DROPPED' },
  { label: 'Graduated', value: 'GRADUATED' }
]

const statusColor: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  ACTIVE: 'success',
  TRANSFERRED: 'warning',
  DROPPED: 'error',
  GRADUATED: 'neutral'
}

// ponytail: column param typed as any — DataTableColumnInstance not exported from #components
const mkHeader = (label: string, icon: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ column }: { column: any }) => h(DataTableHeader, {
    'column': column,
    'label': label,
    'icon': icon,
    'modelValue': q.value.orderBy ?? [],
    'onUpdate:modelValue': (orderBy: unknown) => { q.value.orderBy = orderBy as typeof q.value.orderBy }
  })

const columns: TableColumn<Student>[] = [{
  id: 'select',
  enableHiding: false,
  enableSorting: false,
  size: 40,
  header: ({ table }) => h(UCheckbox, {
    'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
    'onUpdate:modelValue': (value: unknown) => table.toggleAllPageRowsSelected(!!value),
    'aria-label': 'Select all'
  }),
  cell: ({ row }) => h(UCheckbox, {
    'modelValue': row.getIsSelected(),
    'onUpdate:modelValue': (value: unknown) => row.toggleSelected(!!value),
    'aria-label': 'Select row'
  })
}, {
  accessorKey: 'code',
  meta: { label: 'Code', cellType: 'text' },
  header: mkHeader('Code', 'i-lucide-hash')
}, {
  id: 'name',
  accessorKey: 'profile.name',
  meta: { label: 'Name', cellType: 'text' },
  header: mkHeader('Name', 'i-lucide-user'),
  cell: ({ row }) => h(UUser, {
    name: row.original.profile?.name || '-',
    avatar: { alt: row.original.profile?.name || '?' }
  })
}, {
  id: 'nisn',
  accessorKey: 'profile.nisn',
  meta: { label: 'NISN', cellType: 'text' },
  header: mkHeader('NISN', 'i-lucide-id-card'),
  cell: ({ row }) => row.original.profile?.nisn
    ? h('span', row.original.profile.nisn)
    : h(NullContent)
}, {
  id: 'nik',
  accessorKey: 'profile.nik',
  meta: { label: 'NIK', cellType: 'text' },
  header: mkHeader('NIK', 'i-lucide-credit-card'),
  cell: ({ row }) => row.original.profile?.nik
    ? h('span', row.original.profile.nik)
    : h(NullContent)
}, {
  id: 'gender',
  accessorKey: 'profile.gender',
  meta: {
    label: 'Gender',
    cellType: 'enum',
    enum: [
      { value: 'MALE', label: 'Laki-laki' },
      { value: 'FEMALE', label: 'Perempuan' }
    ]
  },
  header: mkHeader('Gender', 'i-lucide-venus-and-mars'),
  cell: ({ row }) => {
    const g = row.original.profile?.gender
    if (!g) return h(NullContent)
    return h('span', g === 'MALE' ? 'Laki-laki' : 'Perempuan')
  }
}, {
  accessorKey: 'profile.birthDate',
  meta: { label: 'Birth Date', cellType: 'date' },
  header: mkHeader('Birth Date', 'i-lucide-calendar'),
  cell: ({ row }) => {
    const d = row.original.profile?.birthDate
    return d ? h('span', new Date(d).toLocaleDateString('id-ID')) : h(NullContent)
  }
}, {
  accessorKey: 'profile.phone',
  meta: { label: 'Phone', cellType: 'text' },
  header: mkHeader('Phone', 'i-lucide-phone'),
  cell: ({ row }) => row.original.profile?.phone
    ? h('span', row.original.profile.phone)
    : h(NullContent)
}, {
  accessorKey: 'status',
  meta: {
    label: 'Status',
    cellType: 'enum',
    enum: [
      { value: 'ACTIVE', label: 'Active', color: 'success' },
      { value: 'TRANSFERRED', label: 'Transferred', color: 'warning' },
      { value: 'DROPPED', label: 'Dropped', color: 'error' },
      { value: 'GRADUATED', label: 'Graduated', color: 'neutral' }
    ]
  },
  header: mkHeader('Status', 'i-lucide-circle-dot')
}, {
  accessorKey: 'enrollDate',
  meta: { label: 'Enroll Date', cellType: 'date' },
  header: mkHeader('Enroll Date', 'i-lucide-calendar-check'),
  cell: ({ row }) => {
    const d = row.original.enrollDate
    return d ? h('span', new Date(d).toLocaleDateString('id-ID')) : h(NullContent)
  }
}, {
  accessorKey: 'graduatedAt',
  meta: { label: 'Graduated At', cellType: 'date' },
  header: mkHeader('Graduated At', 'i-lucide-graduation-cap'),
  cell: ({ row }) => {
    const d = row.original.graduatedAt
    return d ? h('span', new Date(d).toLocaleDateString('id-ID')) : h(NullContent)
  }
}, {
  accessorKey: 'createdAt',
  meta: { label: 'Created', cellType: 'date' },
  header: mkHeader('Created', 'i-lucide-clock'),
  cell: ({ row }) => h(resolveComponent('RelativeTimeCard'), {
    date: row.original.createdAt,
    label: formatDate(row.original.createdAt)
  })
}]

useHead({ title: 'Students' })
</script>

<template>
  <div class="flex flex-1 overflow-hidden">
    <UDashboardPanel :ui="{ body: 'p-0!' }">
      <template #header>
        <UDashboardNavbar title="Students">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UButton
              variant="ghost"
              icon="i-lucide-refresh-cw"
              :loading="asyncStatus === 'loading'"
              @click="refresh()"
            />
            <StudentCreateFormOverlay @after-create="refresh()">
              <UButton
                label="New"
                icon="i-lucide-plus"
              />
            </StudentCreateFormOverlay>
          </template>
        </UDashboardNavbar>
        <UDashboardToolbar>
          <UDropdownMenu
            v-if="selectedRows.length && selectionItems.length"
            :items="selectionItems"
          >
            <UButton
              variant="soft"
              icon="i-lucide-list-checks"
              :label="`${selectedRows.length} selected`"
            />
          </UDropdownMenu>
          <DataTableColumnFilterButton
            v-model="q.where"
            :model="'Student'"
            :columns="columns"
          />
          <DataTableFilterTags
            v-model="q.where"
            :model="'Student'"
            :columns="columns"
          />
          <div class="grow" />
          <DataTableColumnSortButton
            v-model="q.orderBy"
            :model="'Student'"
            :columns="columns"
          />
          <DataTableColumnVisibilityButton
            v-model="columnVisibility"
            :columns="columns"
          />
        </UDashboardToolbar>
      </template>

      <template #body>
        <UTable
          v-model:column-visibility="columnVisibility"
          v-model:column-pinning="columnPinning"
          v-model:row-selection="rowSelection"
          class="flex-1"
          :get-row-id="row => row.id"
          :columns="columns"
          :data="rows ?? []"
          :loading="asyncStatus === 'loading'"
          sticky="header"
        >
          <template #code-cell="{ row }">
            <LazyEditableContent
              v-model="row.original.code"
              :label="row.original.code"
              @submit="() => updateStudentField(row.original, 'code', row.original.code)"
            >
              <UInput
                v-model="row.original.code"
                size="sm"
              />
            </LazyEditableContent>
          </template>

          <template #name-cell="{ row }">
            <LazyEditableContent
              v-model="row.original.profile.name"
              :label="row.original.profile?.name"
              @submit="() => updateProfileField(row.original, 'name', row.original.profile?.name)"
            >
              <template #label="{ label }">
                <UUser
                  v-if="label"
                  :name="label"
                  size="xs"
                  :avatar="{ alt: label }"
                  :ui="{ name: 'text-sm font-normal' }"
                />
                <NullContent v-else />
              </template>
              <UInput
                v-model="row.original.profile.name"
                size="sm"
              />
            </LazyEditableContent>
          </template>

          <template #nisn-cell="{ row }">
            <LazyEditableContent
              v-model.nullable="row.original.profile.nisn"
              :label="row.original.profile?.nisn || undefined"
              @submit="() => updateProfileField(row.original, 'nisn', row.original.profile?.nisn)"
            >
              <UInput
                :model-value="row.original.profile.nisn ?? ''"
                size="sm"
                @update:model-value="(v) => { if (row.original.profile) row.original.profile.nisn = v || null }"
              />
            </LazyEditableContent>
          </template>

          <template #nik-cell="{ row }">
            <LazyEditableContent
              v-model.nullable="row.original.profile.nik"
              :label="row.original.profile?.nik || undefined"
              @submit="() => updateProfileField(row.original, 'nik', row.original.profile?.nik)"
            >
              <UInput
                :model-value="row.original.profile.nik ?? ''"
                size="sm"
                @update:model-value="(v) => { if (row.original.profile) row.original.profile.nik = v || null }"
              />
            </LazyEditableContent>
          </template>

          <template #phone-cell="{ row }">
            <LazyEditableContent
              v-model.nullable="row.original.profile.phone"
              :label="row.original.profile?.phone || undefined"
              @submit="() => updateProfileField(row.original, 'phone', row.original.profile?.phone)"
            >
              <UInput
                :model-value="row.original.profile.phone ?? ''"
                size="sm"
                @update:model-value="(v) => { if (row.original.profile) row.original.profile.phone = v || null }"
              />
            </LazyEditableContent>
          </template>

          <template #status-cell="{ row }">
            <LazyEditableContent
              v-model="row.original.status"
              :label="row.original.status"
              class="w-full justify-center"
              @submit="(value: string) => updateStudentField(row.original, 'status', value)"
            >
              <template #label="{ label }">
                <UBadge
                  :color="statusColor[label as string] ?? 'neutral'"
                  variant="subtle"
                >
                  {{ label }}
                </UBadge>
              </template>
              <USelect
                v-model="row.original.status"
                :items="statusOptions"
                size="sm"
              />
            </LazyEditableContent>
          </template>

          <template #enrollDate-cell="{ row }">
            <LazyEditableContent
              v-model.nullable="row.original.enrollDate"
              :label="row.original.enrollDate?.toString()"
              @submit="(value: string) => updateStudentField(row.original, 'enrollDate', value ? new Date(value) : null)"
            >
              <template #label="{ label }">
                <RelativeTimeCard
                  :date="label ? new Date(label) : null"
                  :label="label ? new Date(label).toLocaleDateString('id-ID') : '-'"
                />
              </template>
              <UInput
                :model-value="formatDate(row.original.enrollDate, 'YYYY-MM-DD')"
                type="date"
                size="sm"
                @update:model-value="(value) => updateStudentField(row.original, 'enrollDate', value ? new Date(value) : null)"
              />
            </LazyEditableContent>
          </template>

          <template #graduatedAt-cell="{ row }">
            <LazyEditableContent
              v-model.nullable="row.original.graduatedAt"
              :label="row.original.graduatedAt?.toString()"
              @submit="(value: string) => updateStudentField(row.original, 'graduatedAt', value ? new Date(value) : null)"
            >
              <template #label="{ label }">
                <RelativeTimeCard
                  :date="label ? new Date(label) : null"
                  :label="label ? new Date(label).toLocaleDateString('id-ID') : '-'"
                />
              </template>
              <UInput
                :model-value="formatDate(row.original.graduatedAt, 'YYYY-MM-DD')"
                type="date"
                size="sm"
                @update:model-value="(value) => updateStudentField(row.original, 'graduatedAt', value ? new Date(value) : null)"
              />
            </LazyEditableContent>
          </template>

          <template #createdAt-cell="{ row }">
            <RelativeTimeCard
              :date="row.original.createdAt"
              :label="formatDate(row.original.createdAt)"
            />
          </template>
        </UTable>
        <DataTablePagination
          v-model:page="q.page"
          v-model:limit="q.limit"
          :total="total ?? 0"
          class="border-t border-default"
        />
      </template>
    </UDashboardPanel>
  </div>
</template>
