'use client';
import { useState } from 'react';

/* Utilidades */
function onlyDigits(s: string) { return (s || '').replace(/\D+/g, ''); }
function cleanAllergies(s?: string | null) {
  const v = (s || '').trim().toLowerCase();
  if (!v || v === 'no' || v === 'ninguna' || v === 'n/a' || v === 'na') return '';
  return (s || '').trim();
}
function toISODateOrNull(s: string) {
  if (!s) return null;
  // Ya viene ISO (AAAA-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // Intenta parsear formatos con / u otros
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/* Tipos */
type Child = { full_name: string; dob: string; allergies?: string; notes?: string };

export default function SignupPage() {
  /* Estado */
  const [guardian, setGuardian] = useState({
    full_name: '',
    phone: '',
    email: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });
  const [children, setChildren] = useState<Child[]>([
    { full_name: '', dob: '', allergies: '', notes: '' }
  ]);

  /* Acciones */
  const addChild = () =>
    setChildren([...children, { full_name: '', dob: '', allergies: '', notes: '' }]);

  async function onSubmit(e: any) {
    e.preventDefault();

    // Validaciones básicas
    if (!guardian.full_name.trim()) return alert('Escribe el nombre del tutor.');
    if (!onlyDigits(guardian.phone)) return alert('Teléfono del tutor inválido.');

    // Normalizar fechas de todos los niños
    const normalizedChildren: Child[] = [];
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!c.full_name.trim()) return alert(`Escribe el nombre del niño #${i + 1}.`);
      const iso = toISODateOrNull(c.dob);
      if (!iso) return alert(`Fecha inválida en el niño #${i + 1}. Usa el selector o AAAA-MM-DD.`);
      normalizedChildren.push({
        full_name: c.full_name.trim(),
        dob: iso,
        allergies: cleanAllergies(c.allergies) || '',
        notes: (c.notes || '').trim()
      });
    }

    // Payload normalizado
    const payload = {
      guardian: {
        full_name: guardian.full_name.trim(),
        phone: onlyDigits(guardian.phone),
        email: guardian.email.trim(),
        emergency_contact_name: guardian.emergency_contact_name.trim(),
        emergency_contact_phone: onlyDigits(guardian.emergency_contact_phone)
      },
      children: normalizedChildren.map(c => ({
        full_name: c.full_name,
        dob: c.dob, // ISO AAAA-MM-DD
        allergies: c.allergies ? c.allergies : null,
        notes: c.notes ? c.notes : null
      }))
    };

    try {
      const r = await fetch('/api/kiosk/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (j.ok) {
        alert('Familia registrada ✅');
        // Reset
        setGuardian({
          full_name: '',
          phone: '',
          email: '',
          emergency_contact_name: '',
          emergency_contact_phone: ''
        });
        setChildren([{ full_name: '', dob: '', allergies: '', notes: '' }]);
      } else {
        alert('Error en el servidor: ' + (j.error || 'desconocido'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Error de red: ' + (err?.message || String(err)));
    }
  }

  /* UI */
  return (
    <div style={{ padding: 20, maxWidth: 640, margin: '0 auto' }}>
      <h1>Inscripción de Familia</h1>

      <form onSubmit={onSubmit}>
        <h2>Tutor</h2>
        <input
          placeholder="Nombre completo"
          required
          value={guardian.full_name}
          onChange={e => setGuardian({ ...guardian, full_name: e.target.value })}
        />
        <input
          placeholder="Teléfono (solo dígitos)"
          required
          value={guardian.phone}
          onChange={e => setGuardian({ ...guardian, phone: e.target.value })}
        />
        <input
          placeholder="Email (opcional)"
          value={guardian.email}
          onChange={e => setGuardian({ ...guardian, email: e.target.value })}
        />
        <input
          placeholder="Contacto de emergencia (opcional)"
          value={guardian.emergency_contact_name}
          onChange={e => setGuardian({ ...guardian, emergency_contact_name: e.target.value })}
        />
        <input
          placeholder="Tel. de emergencia (solo dígitos, opcional)"
          value={guardian.emergency_contact_phone}
          onChange={e =>
            setGuardian({ ...guardian, emergency_contact_phone: e.target.value })
          }
        />

        <h2>Niños</h2>
        {children.map((c, i) => (
          <div key={i} style={{ border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
            <input
              placeholder="Nombre completo"
              required
              value={c.full_name}
              onChange={e => {
                const n = [...children];
                n[i].full_name = e.target.value;
                setChildren(n);
              }}
            />

            {/* Fecha con selector; igual convertimos cualquier formato a ISO antes de enviar */}
            <input
              type="date"
              required
              value={c.dob}
              onChange={e => {
                const n = [...children];
                n[i].dob = e.target.value;
                setChildren(n);
              }}
            />

            <input
              placeholder="Alergias (escribe 'no' o deja vacío)"
              value={c.allergies || ''}
              onChange={e => {
                const n = [...children];
                n[i].allergies = e.target.value;
                setChildren(n);
              }}
            />
            <input
              placeholder="Notas (opcional)"
              value={c.notes || ''}
              onChange={e => {
                const n = [...children];
                n[i].notes = e.target.value;
                setChildren(n);
              }}
            />
          </div>
        ))}

        <button type="button" onClick={addChild}>+ Agregar niño</button>
        <button type="submit">Guardar</button>
      </form>

      <div style={{ marginTop: 20 }}>
        <a href="/kiosk/checkin">Ir a Check-In →</a>
      </div>

      <style jsx>{`
        input{display:block;width:100%;padding:10px;margin:6px 0;border:1px solid #ccc;border-radius:6px}
        button{padding:10px 14px;border:1px solid #000;border-radius:6px;margin-right:8px}
      `}</style>
    </div>
  );
}