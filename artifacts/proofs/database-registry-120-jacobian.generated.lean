theorem geometric_bridge_det(J)_Inv(J) : ricis_prod (zero_monad "det(J)") (inf_monad "Inv(J)") = det(J) * Inv(J) := by
  apply ricis_det_bridge
  rfl
