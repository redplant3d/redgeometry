struct VertexIn {
    @location(0) position: vec3f,
};

struct TransformIn {
    @location(1) col0: vec4f,
    @location(2) col1: vec4f,
    @location(3) col2: vec4f,
};

struct VertexOut {
    @builtin(position) position: vec4f,
};

struct FragmentOut {
    @location(0) color: vec4f,
};

@group(0) @binding(0)
var<uniform> viewProjection: mat4x4f;

@group(1) @binding(0)
var<uniform> color: vec4f;

@vertex
fn vertex_main(vtxIn: VertexIn, matIn: TransformIn) -> VertexOut {
    var pos = vec4f(vtxIn.position, 1.0);
    var model = mat4x4f(matIn.col0, matIn.col1, matIn.col2, vec4f(0, 0, 0, 1));

    var vtxOut: VertexOut;
    vtxOut.position = pos * model * viewProjection;

    return vtxOut;
}

@fragment
fn fragment_main() -> FragmentOut {
    var out: FragmentOut;
    out.color = color;
    return out;
}
