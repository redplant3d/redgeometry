struct VertexIn {
    @location(0)
    position: vec3<f32>,
};

struct VertexOut {
    @builtin(position)
    position: vec4<f32>,
};

struct FragmentOut {
    @location(0)
    color: vec4<f32>,
};

@group(0) @binding(0)
var<uniform> world: mat4x4<f32>;

@group(1) @binding(0)
var<uniform> transform: mat4x4<f32>;
@group(1) @binding(1)
var<uniform> color: vec4<f32>;

@vertex
fn vertex_main(in: VertexIn) -> VertexOut {
    var pos = vec4<f32>(in.position, 1.0);
    var out: VertexOut;
    out.position = pos * transform * world;
    return out;
}

@fragment
fn fragment_main() -> FragmentOut {
    var out: FragmentOut;
    out.color = color;
    return out;
}
