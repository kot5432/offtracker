fn main() {
    let x: Option<i32> = Some(1);
    println!(\"Hello {:?}\", x);
    let r: Result<i32, &str> = Ok(5);
    match r {
        Ok(v) => println!(\"val {}\", v),
        Err(e) => println!(\"err {}\", e),
    }
}
