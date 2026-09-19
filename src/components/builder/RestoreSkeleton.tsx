/**
 * Stands in while a shared document is decoded out of the URL.
 *
 * The hash never reaches the server, so the server always renders the default
 * document. A visitor opening someone's link would see that default first and
 * watch it be replaced. A script in the head sets `data-restoring` before
 * anything paints, and CSS shows this instead until the real document lands.
 * Anyone arriving without a hash never sees it.
 */
const Bar = ({ w }: { w: string }) => (
  <span className="block h-2.5 rounded-full bg-line" style={{ width: w }} />
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-xl bg-panel p-3 shadow-raised">
    {children}
  </div>
);

export const RestoreSkeleton = () => (
  <div
    aria-hidden
    className="restore-skeleton min-h-0 flex-1 animate-[pulse-soft_1.6s_ease-in-out_infinite] gap-2 p-2 pt-0"
  >
    <div className="flex min-h-0 flex-1 gap-2 lg:hidden">
      <Card>
        <Bar w="45%" />
        <Bar w="70%" />
        <Bar w="60%" />
      </Card>
    </div>

    <div className="hidden min-h-0 flex-1 gap-2 lg:flex">
      <div className="flex w-[18%] min-w-0">
        <Card>
          <Bar w="55%" />
          <Bar w="70%" />
          <Bar w="40%" />
        </Card>
      </div>
      <div className="flex w-[26%] min-w-0">
        <Card>
          <Bar w="40%" />
          <Bar w="80%" />
        </Card>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Card>
          <Bar w="35%" />
          <Bar w="65%" />
          <Bar w="50%" />
        </Card>
        <Card>
          <Bar w="30%" />
          <Bar w="75%" />
        </Card>
      </div>
    </div>
  </div>
);
