--
-- Created by IntelliJ IDEA.
-- User: amira
-- Date: 17/11/17
-- Time: 12:30
-- To change this template use File | Settings | File Templates.
--

-- globalMessage("Daedalus SDK loaded")
-- print("Daedalus SDK loaded")
local ship = getPlayerShip(-1)
ship._daedalus_hooks = {}
--local i = 0
--function init()
--    print("Daedalus SDK loaded " .. i)
--i = i + 1
--    -- _G._daedalus_hooks = {}
--end

function update(delta)
    -- globalMessage(live_msg .. delta)
    for i, hook in ipairs(ship._daedalus_hooks) do
        hook(delta)
    end
end



