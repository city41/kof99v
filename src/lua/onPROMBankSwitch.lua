cpu = manager.machine.devices[":maincpu"]
mem = cpu.spaces["program"]

address = 0x200000
size = 0xfffff

PCs = {}

function on_memory_write(offset, data, mask)
	print(string.format("bank switch write at %x, value: %x, mask: %x, pc: %s", offset, data, mask, cpu.state["PC"]))
end

mem_handler = mem:install_write_tap(address, address + size, "writes", on_memory_write)
