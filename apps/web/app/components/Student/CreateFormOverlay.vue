<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent, SelectItem } from '@nuxt/ui'

const { client } = useDbClient()
const authClient = useAuthClient()
const activeOrganization = authClient?.useActiveOrganization()
const form = useTemplateRef('form')
const toast = useToast()
const open = ref(false)

const genderOptions: SelectItem[] = [
  { label: 'Laki-laki', value: 'MALE' },
  { label: 'Perempuan', value: 'FEMALE' }
]

const schema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  nisn: z.string().optional(),
  nik: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  birthDate: z.string().optional(),
  phone: z.string().optional(),
  enrollDate: z.string()
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  enrollDate: formatDate(new Date(), 'YYYY-MM-DD')
})

const { mutateAsync: createPerson } = client.person.useCreate()
const { mutateAsync: createStudent } = client.student.useCreate()

const emit = defineEmits<{
  afterCreate: []
}>()

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const orgId = activeOrganization?.value?.data?.id
  try {
    const person = await createPerson({
      data: {
        name: payload.data.name,
        nisn: payload.data.nisn ?? null,
        nik: payload.data.nik ?? null,
        gender: payload.data.gender ?? null,
        birthDate: payload.data.birthDate ? new Date(payload.data.birthDate) : null,
        phone: payload.data.phone ?? null,
        organizationId: orgId ?? ''
      }
    })

    await createStudent({
      data: {
        code: payload.data.code,
        enrollDate: new Date(payload.data.enrollDate),
        profileId: person.id,
        organizationId: orgId ?? ''
      }
    })

    toast.add({ description: 'Student created successfully' })
    open.value = false
    emit('afterCreate')
  } catch (error) {
    handleError(error, form)
  }
}
</script>

<template>
  <USlideover
    v-model:open="open"
    title="New Student"
  >
    <slot />
    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        @submit="onSubmit"
      >
        <div class="space-y-4">
          <UPageCard
            title="Student Information"
            variant="naked"
            :ui="{ title: 'text-sm font-normal', container: 'gap-2' }"
          >
            <UFormField
              label="Code"
              name="code"
              required
            >
              <UInput
                v-model="state.code"
                placeholder="Student code"
              />
            </UFormField>
            <UFormField
              label="Full Name"
              name="name"
              required
            >
              <UInput
                v-model="state.name"
                placeholder="Full name"
              />
            </UFormField>
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="NISN"
                name="nisn"
              >
                <UInput
                  v-model="state.nisn"
                  placeholder="NISN"
                />
              </UFormField>
              <UFormField
                label="NIK"
                name="nik"
              >
                <UInput
                  v-model="state.nik"
                  placeholder="NIK"
                />
              </UFormField>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <UFormField
                label="Gender"
                name="gender"
              >
                <USelectMenu
                  v-model="state.gender"
                  :items="genderOptions"
                  value-key="value"
                  label-key="label"
                  placeholder="Select gender"
                />
              </UFormField>
              <UFormField
                label="Birth Date"
                name="birthDate"
              >
                <UInput
                  v-model="state.birthDate"
                  type="date"
                />
              </UFormField>
            </div>
            <UFormField
              label="Phone"
              name="phone"
            >
              <UInput
                v-model="state.phone"
                placeholder="Phone number"
              />
            </UFormField>
          </UPageCard>

          <UPageCard
            title="Enrollment"
            variant="naked"
            :ui="{ title: 'text-sm font-normal', container: 'gap-2' }"
          >
            <UFormField
              label="Enroll Date"
              name="enrollDate"
              required
            >
              <UInput
                v-model="state.enrollDate"
                type="date"
              />
            </UFormField>
          </UPageCard>
        </div>
      </UForm>
    </template>
    <template #footer="{ close }">
      <UButton
        variant="soft"
        label="Cancel"
        @click="close"
      />
      <div class="grow" />
      <UButton
        loading-auto
        label="Create Student"
        icon="i-lucide-check"
        @click="form?.submit()"
      />
    </template>
  </USlideover>
</template>
